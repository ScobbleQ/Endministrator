import {
  ButtonStyle,
  ContainerBuilder,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  SlashCommandBuilder,
  TextDisplayBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { ButtonBuilder } from '@discordjs/builders';
import {
  generateCredByCode,
  getBinding,
  grantOAuth,
  tokenByEmailPassword,
} from '../skport/api/index.js';
import { computeSign } from '../skport/util/computeSign.js';

export default {
  data: new SlashCommandBuilder()
    .setName('login')
    .setDescription('Login to SKPort')
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @returns {Promise<void>}
   */
  async execute(interaction) {
    const container = new ContainerBuilder();

    const textDisplay = new TextDisplayBuilder().setContent(
      [
        '# Login to SKPort',
        'By clicking the button below, you will be asked to enter your credentials.',
        '',
        'Your credentials (email and password) will **not** be stored.',
        'If you have any doubts to how we handle your data, please check our [GitHub repository](https://github.com/ScobbleQ/Endministrator)',
        'The code is open sourced and in src/commands/login.js',
      ].join('\n')
    );
    container.addTextDisplayComponents(textDisplay);

    const loginButton = new ButtonBuilder()
      .setCustomId('login')
      .setLabel('Login')
      .setStyle(ButtonStyle.Primary);
    container.addActionRowComponents((row) => row.addComponents(loginButton));

    await interaction.reply({
      components: [container],
      flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
    });
  },
  /**
   * @param {import("discord.js").ButtonInteraction} interaction
   */
  async button(interaction) {
    const modal = new ModalBuilder().setCustomId('login').setTitle('Login to SKPort');

    const emailInput = new TextInputBuilder()
      .setCustomId('email')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('placeholder text')
      .setRequired(true);

    const emailLabel = new LabelBuilder()
      .setLabel('Email')
      .setDescription('Enter your email address')
      .setTextInputComponent(emailInput);

    const passwordInput = new TextInputBuilder()
      .setCustomId('password')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('placeholder text')
      .setRequired(true);

    const passwordLabel = new LabelBuilder()
      .setLabel('Password')
      .setDescription('Enter your password')
      .setTextInputComponent(passwordInput);

    modal.addLabelComponents(emailLabel, passwordLabel);
    await interaction.showModal(modal);
  },
  /**
   * @param {import("discord.js").ModalSubmitInteraction} interaction
   */
  async modal(interaction) {
    const email = interaction.fields.getTextInputValue('email');
    const password = interaction.fields.getTextInputValue('password');

    const initContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent('Attempting to login...')
    );

    await interaction.reply({
      components: [initContainer],
      flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
    });

    try {
      const login = await tokenByEmailPassword(email, password);
      if (login.status !== 0) {
        const errorContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(login.msg)
        );
        await interaction.editReply({
          components: [errorContainer],
          flags: [MessageFlags.IsComponentsV2],
        });
        return;
      }

      // Login is successful, now get the needed data to continue
      const loginSuccessContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent('Login successful, attempting to grant credentials...')
      );

      await interaction.editReply({
        components: [loginSuccessContainer],
        flags: [MessageFlags.IsComponentsV2],
      });

      const oauth = await grantOAuth({ token: login.data.token, type: 0 });
      if (!oauth || oauth.status !== 0) {
        const oauthErrorContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(oauth.msg || 'Failed to grant OAuth token')
        );
        await interaction.editReply({
          components: [oauthErrorContainer],
          flags: [MessageFlags.IsComponentsV2],
        });
        return;
      }

      // @ts-ignore: code is guaranteed since we are using type 0
      const cred = await generateCredByCode({ code: oauth.data.code });
      if (!cred || cred.status !== 0) {
        const credErrorContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(cred.msg || 'Failed to generate credentials')
        );
        await interaction.editReply({
          components: [credErrorContainer],
          flags: [MessageFlags.IsComponentsV2],
        });
        return;
      }

      // Sign the token for the binding API
      const signature = computeSign({
        token: cred.data.token,
        path: '/api/v1/game/player/binding',
        body: '{}',
      });

      const binding = await getBinding({ cred: cred.data.cred, sign: signature });
      if (!binding || binding.status !== 0) {
        const bindingErrorContainer = new ContainerBuilder().addTextDisplayComponents(
          (textDisplay) => textDisplay.setContent(binding.msg || 'Failed to get binding')
        );
        await interaction.editReply({
          components: [bindingErrorContainer],
          flags: [MessageFlags.IsComponentsV2],
        });
        return;
      }

      const endfield = binding.data.find((b) => b.appCode === 'endfield');
      if (!endfield) {
        const endfieldErrorContainer = new ContainerBuilder().addTextDisplayComponents(
          (textDisplay) => textDisplay.setContent('Failed to find Endfield binding')
        );
        await interaction.editReply({
          components: [endfieldErrorContainer],
          flags: [MessageFlags.IsComponentsV2],
        });
        return;
      }

      const roleInfo = endfield.bindingList[0].defaultRole;

      const foundContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent('Account confirmed, attempting to store data...')
      );

      await interaction.editReply({
        components: [foundContainer],
        flags: [MessageFlags.IsComponentsV2],
      });

      // store data in the database

      const successContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          [
            '## Login completed successfully!',
            'The following account has been linked to your Discord account:',
            `Email: \`${login.data.email}\``,
            `Nickname: \`${roleInfo.nickname}\``,
            `UID: \`${roleInfo.roleId}\``,
            `Authority Level: \`${roleInfo.level}\``,
            `Server: \`${roleInfo.serverName}\``,
          ].join('\n')
        )
      );

      await interaction.editReply({
        components: [successContainer],
        flags: [MessageFlags.IsComponentsV2],
      });
    } catch (error) {
      const errorContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          /** @type {Error} */ (error).message || 'An error occurred while logging in'
        )
      );

      await interaction.editReply({
        components: [errorContainer],
        flags: [MessageFlags.IsComponentsV2],
      });
    }
  },
};
