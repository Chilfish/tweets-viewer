import type { CommandGroup } from '@chilfish/devkit/cli'
import { addSpec } from './add'
import { exportSpec } from './export'
import { importSpec } from './import'
import { mediaSpec } from './media'
import { mergeRemoteSpec } from './merge-remote'
import { refreshSpec } from './refresh'
import { syncSpec } from './sync'
import { uploadSpec } from './upload'
import { verifySpec } from './verify'

export const insGroup: CommandGroup = {
  name: 'ins',
  description: 'Instagram 归档：抓取、媒体、入库、对账',
  commands: [
    addSpec,
    exportSpec,
    mediaSpec,
    importSpec,
    syncSpec,
    refreshSpec,
    mergeRemoteSpec,
    verifySpec,
    uploadSpec,
  ],
}
