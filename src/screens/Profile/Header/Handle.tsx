import {View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isInvalidHandle, sanitizeHandle} from '#/lib/strings/handles'
import {isIOS, isNative} from '#/platform/detection'
import {type Shadow} from '#/state/cache/types'
import {useShowLinkInHandle} from '#/state/preferences/show-link-in-handle.tsx'
import {atoms as a, useTheme, web} from '#/alf'
import {InlineLinkText} from '#/components/Link.tsx'
import {NewskieDialog} from '#/components/NewskieDialog'
import {Text} from '#/components/Typography'

export function ProfileHeaderHandle({
  profile,
  disableTaps,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  disableTaps?: boolean
}) {
  const t = useTheme()
  const {_} = useLingui()
  const invalidHandle = isInvalidHandle(profile.handle)
  const blockHide = profile.viewer?.blocking || profile.viewer?.blockedBy
  const isBskySocialHandle = profile.handle.endsWith('.bsky.social')
  const showProfileInHandle = useShowLinkInHandle()
  return (
    <View
      style={[a.flex_row, a.gap_sm, a.align_center, {maxWidth: '100%'}]}
      pointerEvents={disableTaps ? 'none' : isIOS ? 'auto' : 'box-none'}>
      <NewskieDialog profile={profile} disabled={disableTaps} />
      {profile.viewer?.followedBy && !blockHide ? (
        <View style={[t.atoms.bg_contrast_25, a.rounded_xs, a.px_sm, a.py_xs]}>
          <Text style={[t.atoms.text, a.text_sm]}>
            <Trans>Follows you</Trans>
          </Text>
        </View>
      ) : undefined}
      <Text
        emoji
        numberOfLines={1}
        style={[
          invalidHandle
            ? [
                a.border,
                a.text_xs,
                a.px_sm,
                a.py_xs,
                a.rounded_xs,
                {borderColor: t.palette.contrast_200},
              ]
            : [a.text_md, a.leading_snug, t.atoms.text_contrast_medium],
          web({
            wordBreak: 'break-all',
            direction: 'ltr',
            unicodeBidi: 'isolate',
          }),
        ]}>
        {invalidHandle ? (
          _(msg`⚠Invalid Handle`)
        ) : showProfileInHandle && !isBskySocialHandle ? (
          <InlineLinkText
            to={`https://${profile.handle}`}
            label={profile.handle}>
            <Text style={[a.text_md, {color: t.palette.primary_500}]}>
              sanitizeHandle(profile.handle, '@')
            </Text>
          </InlineLinkText>
        ) : (
          sanitizeHandle(
            profile.handle,
            '@',
            // forceLTR handled by CSS above on web
            isNative,
          )
        )}
      </Text>
    </View>
  )
}
