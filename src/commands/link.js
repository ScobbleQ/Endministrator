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
import { BotConfig } from '../../config.js';
import { createEvent, createUser, getUser } from '../db/queries.js';
import {
  generateCredByCode,
  getBinding,
  grantOAuth,
  tokenByEmailPassword,
} from '../skport/api/index.js';
import { computeSign } from '../skport/util/computeSign.js';
import { MessageTone, alreadyLoggedInContainer, textContainer } from '../utils/containers.js';
import { parseCookieToken } from '../utils/parseCookieToken.js';

export default {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your SKPort account')
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),
  /** @param {import("discord.js").ChatInputCommandInteraction} interaction */
  async execute(interaction) {
    const user = await getUser(interaction.user.id);
    if (user) {
      if (BotConfig.environment === 'production') {
        await createEvent(interaction.user.id, {
          interaction: 'discord',
          metadata: {
            type: 'slash',
            command: 'link',
          },
        });
      }

      await interaction.reply({
        components: [alreadyLoggedInContainer({ tone: MessageTone.Formal })],
        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
      });
      return;
    }

    const container = new ContainerBuilder();

    const textDisplay = new TextDisplayBuilder().setContent(
      [
        '## ▼// Link your SKPort account',
        'By clicking the button below, you agree to our [Terms of Service](https://github.com/ScobbleQ/Endministrator) and [Privacy Policy](https://github.com/ScobbleQ/Endministrator).',
        '',
        'The source code is avaialable on [GitHub](https://github.com/ScobbleQ/Endministrator) if you have any doubts to how we handle your login proccess and data. Rest assured, we do not store any of your login credentials after the login process is completed.',
      ].join('\n')
    );
    container.addTextDisplayComponents(textDisplay);

    const loginButton = new ButtonBuilder()
      .setCustomId('link-login')
      .setLabel('SKPort Login')
      .setStyle(ButtonStyle.Primary);

    const tokenButton = new ButtonBuilder()
      .setCustomId('link-token')
      .setLabel('Enter Cookies')
      .setStyle(ButtonStyle.Primary);

    const infoButton = new ButtonBuilder()
      .setCustomId('link-info')
      .setEmoji({ name: 'circleinfo', id: '1468282138209292482' })
      .setStyle(ButtonStyle.Secondary);

    container.addActionRowComponents((row) =>
      row.addComponents(loginButton, tokenButton, infoButton)
    );

    await interaction.reply({
      components: [container],
      flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
    });
  },
  /** @param {import("discord.js").ButtonInteraction} interaction */
  async button(interaction) {
    const customId = interaction.customId.split('-')[1];

    if (customId === 'login') {
      const loginModal = new ModalBuilder()
        .setCustomId('link-login')
        .setTitle('Link your SKPort account');

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

      loginModal.addLabelComponents(emailLabel, passwordLabel);
      await interaction.showModal(loginModal);
    } else if (customId === 'token') {
      const tokenModal = new ModalBuilder()
        .setCustomId('link-token')
        .setTitle('Link your SKPort account');

      const tokenInput = new TextInputBuilder()
        .setCustomId('token')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('ACCOUNT_TOKEN=___; ssxmod_itna=___; ssxmod_itna2=___; ...etc')
        .setRequired(true);

      const tokenLabel = new LabelBuilder()
        .setLabel('Cookies')
        .setDescription('Enter your cookies')
        .setTextInputComponent(tokenInput);

      tokenModal.addLabelComponents(tokenLabel);
      await interaction.showModal(tokenModal);
    } else if (customId === 'info') {
      const infoContainer = new ContainerBuilder()
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent('## ▼// Linking Information')
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            [
              '### Linking with Login',
              'This is the **recommended** and most straightforward method to link your account. ',
            ].join('\n')
          )
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            [
              '### Linking with Token',
              'This method requires you to log into SKPort and copy the Cookie value from the browser. There is currently no downsides to using this method and still being tested.',
              '',
              'Getting the cookies:',
              '1. Go to [skport.com](<https://game.skport.com/endfield/sign-in>) do __NOT__ log in yet.',
              "2. Open your browser's developer tools ([How to open DevTools](https://balsamiq.com/support/faqs/browserconsole/))",
              '3. Navigate to the **“Network”** tab in developer tools.',
              '4. Now log in with the developer tools open, you should see things populate in the network tab.',
              '5. In the search box, type **token** and click on the result labeled **account_token**.',
              '6. Under the **Headers** tab, locate the **Request** section.',
              '7. Copy everything after **Cookie:** and paste it into the text field provided.',
            ].join('\n')
          )
        );

      await interaction.reply({
        components: [infoContainer],
        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
      });
    }
  },
  /** @param {import("discord.js").ModalSubmitInteraction} interaction */
  async modal(interaction) {
    await interaction.deferUpdate();

    /** @type {{ token: string, hgId: string } | null} */
    let loginData = null;

    if (interaction.customId === 'link-login') {
      const email = interaction.fields.getTextInputValue('email');
      const password = interaction.fields.getTextInputValue('password');

      const initContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent('Attempting to login...')
      );

      await interaction.editReply({
        components: [initContainer],
        flags: [MessageFlags.IsComponentsV2],
      });

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

      loginData = { token: login.data.token, hgId: login.data.hgId };
    } else if (interaction.customId === 'link-token') {
      const cookieToken = interaction.fields.getTextInputValue('token');
      const initContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent('Attempting to parse cookie token...')
      );

      await interaction.editReply({
        components: [initContainer],
        flags: [MessageFlags.IsComponentsV2],
      });

      const parsed = parseCookieToken(cookieToken);
      if (!parsed) {
        const errorContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            'Failed to parse cookie. Ensure it contains ACCOUNT_TOKEN, SK_OAUTH_CRED_KEY, and HG_INFO_KEY (with hgId).'
          )
        );
        await interaction.editReply({
          components: [errorContainer],
          flags: [MessageFlags.IsComponentsV2],
        });
        return;
      }

      loginData = { token: parsed.token, hgId: parsed.hgId };
    }

    if (!loginData) {
      const errorContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent('Failed to get login data')
      );
      await interaction.editReply({
        components: [errorContainer],
        flags: [MessageFlags.IsComponentsV2],
      });
      return;
    }

    // Login is successful, now get the needed data to continue
    const credContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent('Attempting to grant credentials...')
    );

    await interaction.editReply({
      components: [credContainer],
      flags: [MessageFlags.IsComponentsV2],
    });

    const oauth = await grantOAuth({ token: loginData.token, type: 0 });
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
      body: '',
    });

    const binding = await getBinding({ cred: cred.data.cred, sign: signature });
    if (!binding || binding.status !== 0) {
      const bindingErrorContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(binding.msg || 'Failed to get binding')
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

    // Get default role from the binding, fallback to first role
    const selectedBinding =
      endfield.bindingList.find((b) => b.isDefault) ?? endfield.bindingList[0];
    const roleInfo =
      selectedBinding.defaultRole ??
      selectedBinding.roles?.find((r) => r.isDefault) ??
      selectedBinding.roles?.[0];

    if (!roleInfo) {
      const noRoleContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent('No game role found for this binding.')
      );
      await interaction.editReply({
        components: [noRoleContainer],
        flags: [MessageFlags.IsComponentsV2],
      });
      return;
    }

    const foundContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent('Account confirmed, attempting to store data...')
    );

    await interaction.editReply({
      components: [foundContainer],
      flags: [MessageFlags.IsComponentsV2],
    });

    // Somehow they got banned...
    if (roleInfo.isBanned) {
      const bannedContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent('The account is banned.')
      );
      await interaction.editReply({
        components: [bannedContainer],
        flags: [MessageFlags.IsComponentsV2],
      });
      return;
    }

    // store data in the database
    await createUser(interaction.user.id, {
      email: '',
      hgId: loginData.hgId,
      loginToken: loginData.token,

      // @ts-ignore: uid is guaranteed since we are using type 0
      oathUid: oauth.data.uid,
      // @ts-ignore: code is guaranteed since we are using type 0
      oauthCode: oauth.data.code,

      cred: cred.data.cred,
      userId: cred.data.userId,
      cToken: cred.data.token,

      serverId: roleInfo.serverId,
      serverName: roleInfo.serverName,
      roleId: roleInfo.roleId,
    });

    const successContainer = new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        [
          '## Login completed successfully!',
          'The following account has been linked to your Discord account:\n',
          `Nickname: \`${roleInfo.nickname}\``,
          `UID: \`${roleInfo.roleId}\``,
          `Authority Level: \`${roleInfo.level}\``,
          `Server: \`${roleInfo.serverName}\``,
          '\nDiscord Server: https://discord.gg/5rUsSZTyf2',
        ].join('\n')
      )
    );

    await interaction.editReply({
      components: [successContainer],
      flags: [MessageFlags.IsComponentsV2],
    });

    // Do a test DM to the user if interaction initiated in a guild
    if (interaction.inGuild()) {
      try {
        const dmContainer = textContainer(
          'This is a test to ensure we have proper permissions to send DMs. You are all set and no action is required.'
        );
        await interaction.user.send({
          components: [dmContainer],
          flags: [MessageFlags.IsComponentsV2],
        });
      } catch (error) {
        const dmErrorContainer = textContainer(
          'An error occurred when we tried to send a DM to you. Please check your DM settings and make sure you have enabled DMs.'
        );
        await interaction.followUp({
          components: [dmErrorContainer],
          flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
        });
      }
    }
  },
};
