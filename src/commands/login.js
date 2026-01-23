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
import axios from 'axios';
import { accountToken } from '../skport/api/accountToken.js';
import { tokenByEmailPassword } from '../skport/api/tokenByEmailPassword.js';

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
      textDisplay.setContent('Checking credentials...')
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

      //
      const loginSuccessContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent('## Login successful\nExtracting token and other info....')
      );

      await interaction.editReply({
        components: [loginSuccessContainer],
        flags: [MessageFlags.IsComponentsV2],
      });

      const token = await accountToken(login.data.token);
      if (token.status !== 0) {
        const errorContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(token.msg)
        );
        await interaction.editReply({
          components: [errorContainer],
          flags: [MessageFlags.IsComponentsV2],
        });
        return;
      }
    } catch (error) {}
  },
};
