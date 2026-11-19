import type { CliGroup, CommandSpec } from '../cli/runtime'
import { devGroup } from './dev'
import { insGroup } from './ins'

export const groups: CliGroup[] = [insGroup, devGroup]

export const rootCommands: CommandSpec[] = []
