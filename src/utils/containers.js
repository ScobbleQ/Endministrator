import { ContainerBuilder } from 'discord.js';

export const MessageTone = {
  Formal: 'formal',
  Informal: 'informal',
};

/**
 *
 * @param {{ tone?: typeof MessageTone[keyof typeof MessageTone] }} param0
 * @returns {ContainerBuilder}
 */
export function noUserContainer({ tone = MessageTone.Formal }) {
  const msg =
    tone === MessageTone.Formal
      ? 'Please log in with `/login` to continue.'
      : "Hey, you're not logged in! Use `/login` to get started.";

  return new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
    textDisplay.setContent(msg)
  );
}

export function alreadyLoggedInContainer({ tone = MessageTone.Formal }) {
  const msg =
    tone === MessageTone.Formal ? 'You are already logged in.' : "Hey, you're already logged in!";

  return new ContainerBuilder().addTextDisplayComponents((textDisplay) =>
    textDisplay.setContent(msg)
  );
}
