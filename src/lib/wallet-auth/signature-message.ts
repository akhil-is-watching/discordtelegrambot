const SIGNATURE_MESSAGE_TEMPLATE =
  "By signing this message, you confirm that you own the wallet:\n\n" +
  "{{walletAddress}}\n\n" +
  "and agree to the Terms and Privacy Policy of https://trynoah.ai.\n\n" +
  "Nonce: {{nonce}}\n" +
  "URI: https://trynoah.ai\n" +
  "Version: 1\n" +
  "Chain ID: mainnet\n" +
  "Issued At: {{issuedAt}}\n\n" +
  "Terms: https://trynoah.ai/document/terms  \n" +
  "Privacy Policy: https://trynoah.ai/document/privacy  \n" +
  "Resources: https://trynoah.ai";

export const generateSignedMessage = (
  walletAddress: string,
  nonce: string,
  issuedAt: string,
): string => {
  return SIGNATURE_MESSAGE_TEMPLATE.replace("{{walletAddress}}", walletAddress)
    .replace("{{nonce}}", nonce)
    .replace("{{issuedAt}}", issuedAt);
};
