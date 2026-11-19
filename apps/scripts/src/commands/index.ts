import type { CommandGroup, CommandSpec } from '@chilfish/devkit/cli'
import { insGroup } from './ins'

export const groups: CommandGroup[] = [insGroup]

export const rootCommands: CommandSpec[] = []
