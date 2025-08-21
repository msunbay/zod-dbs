import pluralize from 'pluralize';

const IGNORED_WORDS = ['data', 'status'];

export const singularize = (word: string): string => {
  if (IGNORED_WORDS.includes(word.toLowerCase())) {
    return word;
  }

  return pluralize.singular(word);
};
