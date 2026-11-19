import type { CommandGroup, CommandSpec } from '@chilfish/devkit/cli'
import { deploySpec } from './deploy'
import { insGroup } from './ins'

export const groups: CommandGroup[] = [insGroup]

export const rootCommands: CommandSpec[] = [deploySpec]
