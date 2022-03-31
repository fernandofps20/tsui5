import { GluegunCommand } from 'gluegun'

const command: GluegunCommand = {
  name: 'tsui5',
  run: async (toolbox) => {
    const { print } = toolbox

    print.info('Welcome to TSUI5')
  },
}

module.exports = command
