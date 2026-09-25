import type { Command } from 'commander'
import type { Rettiwt } from '../Rettiwt'

import { createCommand } from 'commander'
import { output } from '../helper/CliUtils'

/**
 * Creates a new 'space' command which uses the given Rettiwt instance.
 *
 * @param rettiwt - The Rettiwt instance to use.
 * @returns The created 'space' command.
 */
function createSpaceCommand(rettiwt: Rettiwt): Command {
  // Creating the 'space' command
  const space = createCommand('space').description('Access resources related to spaces')

  // Details
  space
    .command('details')
    .description('Fetch the details of a space with the given id')
    .argument('<id>', 'The id of the space')
    .action(async (id: string) => {
      try {
        const details = await rettiwt.space.details(id)
        output(details)
      }
      catch (error) {
        output(error)
      }
    })

  return space
}

export default createSpaceCommand
