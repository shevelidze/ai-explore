import { getEncoding } from 'js-tiktoken';

const encoding = getEncoding('cl100k_base');

const tokenizer = {
  encode: (text: string) => {
    return encoding.encode(text);
  },
  decode: (encoded: number[]) => {
    return encoding.decode(encoded);
  },
};

export { tokenizer };
