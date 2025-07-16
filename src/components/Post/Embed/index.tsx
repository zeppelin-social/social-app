import React from 'react'
import {View} from 'react-native'
import {
  type $Typed,
  type AppBskyFeedDefs,
  AppBskyFeedPost,
  AtUri,
  moderatePost,
  RichText as RichTextAPI,
} from '@atproto/api'
import {Trans} from '@lingui/macro'
import {useQueryClient} from '@tanstack/react-query'

import {usePalette} from '#/lib/hooks/usePalette'
import {makeProfileLink} from '#/lib/routes/links'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {unstableCacheProfileView} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {Link} from '#/view/com/util/Link'
import {PostMeta} from '#/view/com/util/PostMeta'
import {atoms as a, useTheme} from '#/alf'
import {ContentHider} from '#/components/moderation/ContentHider'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {RichText} from '#/components/RichText'
import {Embed as StarterPackCard} from '#/components/StarterPack/StarterPackCard'
import {SubtleWebHover} from '#/components/SubtleWebHover'
import * as bsky from '#/types/bsky'
import {
  type Embed as TEmbed,
  type EmbedType,
  parseEmbed,
} from '#/types/bsky/post'
import {ExternalEmbed} from './ExternalEmbed'
import {ModeratedFeedEmbed} from './FeedEmbed'
import {ImageEmbed} from './ImageEmbed'
import {ModeratedListEmbed} from './ListEmbed'
import {PostPlaceholder as PostPlaceholderText} from './PostPlaceholder'
import {
  type CommonProps,
  type EmbedProps,
  PostEmbedViewContext,
  QuoteEmbedViewContext,
} from './types'
import {VideoEmbed} from './VideoEmbed'

export {PostEmbedViewContext, QuoteEmbedViewContext} from './types'

export function Embed({embed: rawEmbed, ...rest}: EmbedProps) {
  const embed = parseEmbed(rawEmbed)

  switch (embed.type) {
    case 'images':
    case 'link':
    case 'video': {
      return <MediaEmbed embed={embed} {...rest} />
    }
    case 'feed':
    case 'list':
    case 'starter_pack':
    case 'labeler':
    case 'post':
    case 'post_not_found':
    case 'post_blocked':
    case 'post_detached': {
      return <RecordEmbed embed={embed} {...rest} />
    }
    case 'post_with_media': {
      return (
        <View style={rest.style}>
          <MediaEmbed embed={embed.media} {...rest} />
          <RecordEmbed embed={embed.view} {...rest} />
        </View>
      )
    }
    default: {
      return null
    }
  }
}

function MediaEmbed({
  embed,
  ...rest
}: CommonProps & {
  embed: TEmbed
}) {
  switch (embed.type) {
    case 'images': {
      return (
        <ContentHider modui={rest.moderation?.ui('contentMedia')}>
          <ImageEmbed embed={embed} {...rest} />
        </ContentHider>
      )
    }
    case 'link': {
      return (
        <ContentHider modui={rest.moderation?.ui('contentMedia')}>
          <ExternalEmbed
            link={embed.view.external}
            onOpen={rest.onOpen}
            style={[a.mt_sm, rest.style]}
          />
        </ContentHider>
      )
    }
    case 'video': {
      return (
        <ContentHider modui={rest.moderation?.ui('contentMedia')}>
          <VideoEmbed embed={embed.view} />
        </ContentHider>
      )
    }
    default: {
      return null
    }
  }
}

function RecordEmbed({
  embed,
  ...rest
}: CommonProps & {
  embed: TEmbed
}) {
  switch (embed.type) {
    case 'feed': {
      return (
        <View style={a.mt_sm}>
          <ModeratedFeedEmbed embed={embed} {...rest} />
        </View>
      )
    }
    case 'list': {
      return (
        <View style={a.mt_sm}>
          <ModeratedListEmbed embed={embed} />
        </View>
      )
    }
    case 'starter_pack': {
      return (
        <View style={a.mt_sm}>
          <StarterPackCard starterPack={embed.view} />
        </View>
      )
    }
    case 'labeler': {
      // not implemented
      return null
    }
    case 'post':
    case 'post_blocked': {
      if (rest.isWithinQuote && !rest.allowNestedQuotes) {
        return null
      }

      return (
        <QuoteEmbed
          {...rest}
          embed={embed}
          viewContext={
            rest.viewContext === PostEmbedViewContext.Feed
              ? QuoteEmbedViewContext.FeedEmbedRecordWithMedia
              : undefined
          }
          isWithinQuote={rest.isWithinQuote}
          allowNestedQuotes={rest.allowNestedQuotes}
        />
      )
    }
    case 'post_not_found': {
      return (
        <PostPlaceholderText>
          <Trans>Deleted</Trans>
        </PostPlaceholderText>
      )
    }
    case 'post_detached': {
      return <PostDetachedEmbed embed={embed} />
    }
    default: {
      return null
    }
  }
}

export function PostDetachedEmbed({
  embed,
}: {
  embed: EmbedType<'post_detached'>
}) {
  const {currentAccount} = useSession()
  const isViewerOwner = currentAccount?.did
    ? embed.view.uri.includes(currentAccount.did)
    : false

  return (
    <PostPlaceholderText>
      {isViewerOwner ? (
        <Trans>Removed by you</Trans>
      ) : (
        <Trans>Removed by author</Trans>
      )}
    </PostPlaceholderText>
  )
}

/*
 * Nests parent `Embed` component and therefore must live in this file to avoid
 * circular imports.
 */
export function QuoteEmbed({
  embed,
  onOpen,
  style,
  isWithinQuote: parentIsWithinQuote,
  allowNestedQuotes: parentAllowNestedQuotes,
}: Omit<CommonProps, 'viewContext'> & {
  embed: EmbedType<'post'> | EmbedType<'post_blocked'>
  viewContext?: QuoteEmbedViewContext
}) {
  const record =
    embed.type === 'post'
      ? embed.view.value
      : // FIXME once @zeppelin-social/api is upgraded past 0.15.26
        (embed.view['social.zeppelin.value']!.record as any)
  const author =
    embed.type === 'post'
      ? embed.view.author
      : // @ts-expect-error — FIXME this won't error once @zeppelin-social/api is upgraded past 0.15.26
        embed.view['social.zeppelin.author']
  const quoteEmbed = embed.type === 'post' ? embed.view.embeds?.[0] : undefined
  const cid =
    embed.type === 'post'
      ? embed.view.cid
      : // @ts-expect-error — FIXME this won't error once @zeppelin-social/api is upgraded past 0.15.26
        embed.view['social.zeppelin.cid']
  const indexedAt =
    embed.type === 'post'
      ? embed.view.indexedAt
      : // @ts-expect-error — FIXME this won't error once @zeppelin-social/api is upgraded past 0.15.26
        embed.view['social.zeppelin.indexedAt']!

  const moderationOpts = useModerationOpts()
  const quote = React.useMemo<$Typed<AppBskyFeedDefs.PostView>>(
    () => ({
      $type: 'app.bsky.feed.defs#postView',
      record,
      embed: quoteEmbed,
      uri: embed.view.uri,
      cid,
      author,
      indexedAt,
    }),
    [record, author, quoteEmbed, embed, cid, indexedAt],
  )
  const moderation = React.useMemo(() => {
    return moderationOpts ? moderatePost(quote, moderationOpts) : undefined
  }, [quote, moderationOpts])

  const t = useTheme()
  const queryClient = useQueryClient()
  const pal = usePalette('default')
  const itemUrip = new AtUri(quote.uri)
  const itemHref = makeProfileLink(quote.author, 'post', itemUrip.rkey)
  const itemTitle = `Post by ${quote.author.handle}`

  const richText = React.useMemo(() => {
    if (
      !bsky.dangerousIsType<AppBskyFeedPost.Record>(
        quote.record,
        AppBskyFeedPost.isRecord,
      )
    )
      return undefined
    const {text, facets} = quote.record
    return text.trim()
      ? new RichTextAPI({text: text, facets: facets})
      : undefined
  }, [quote.record])

  const onBeforePress = React.useCallback(() => {
    unstableCacheProfileView(queryClient, quote.author)
    onOpen?.()
  }, [queryClient, quote.author, onOpen])

  const [hover, setHover] = React.useState(false)
  return (
    <View
      style={[a.mt_sm, a.rounded_md, a.border, t.atoms.border_contrast_low]}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}>
      <>
        <SubtleWebHover hover={hover} style={[a.rounded_md]} />
        <Link
          style={[a.p_md]}
          hoverStyle={{borderColor: pal.colors.borderLinkHover}}
          href={itemHref}
          title={itemTitle}
          onBeforePress={onBeforePress}>
          <View pointerEvents="none">
            <PostMeta
              author={quote.author}
              moderation={moderation}
              showAvatar
              postHref={itemHref}
              timestamp={quote.indexedAt}
            />
          </View>
          <ContentHider
            modui={moderation?.ui('contentList')}
            style={style}
            activeStyle={[a.pt_sm, a.pb_0]}
            childContainerStyle={[a.pt_sm]}>
            {moderation ? (
              <PostAlerts
                modui={moderation.ui('contentView')}
                style={[a.py_xs]}
              />
            ) : null}
            {richText ? (
              <RichText
                value={richText}
                style={a.text_md}
                numberOfLines={20}
                disableLinks
              />
            ) : null}
            {quote.embed && (
              <Embed
                embed={quote.embed}
                moderation={moderation}
                isWithinQuote={parentIsWithinQuote ?? true}
                // already within quote? override nested
                allowNestedQuotes={
                  parentIsWithinQuote ? false : parentAllowNestedQuotes
                }
              />
            )}
          </ContentHider>
        </Link>
      </>
    </View>
  )
}
