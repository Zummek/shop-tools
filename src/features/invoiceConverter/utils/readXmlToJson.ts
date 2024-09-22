import * as xml2js from 'xml2js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const readXmlToJson = async (file: File): Promise<any> => {
  const parser = new xml2js.Parser();
  const fileText = await file.text();
  return parser.parseStringPromise(fileText);
};
