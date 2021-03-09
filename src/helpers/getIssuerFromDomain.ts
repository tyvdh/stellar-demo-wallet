import { StellarTomlResolver } from "stellar-sdk";

export const getIssuerFromDomain = async ({
  assetCode,
  homeDomain,
}: {
  assetCode: string;
  homeDomain: string;
}) => {
  let domain = homeDomain;

  domain = domain.startsWith("http") ? domain : `https://${domain}`;
  domain = domain.replace(/\/$/, "");

  let domainURL;
  try {
    domainURL = new URL(domain);
  } catch (e) {
    throw new Error("anchor home domain is not a valid URL using HTTPS");
  }

  const toml =
    domainURL.protocol === "http:"
      ? await StellarTomlResolver.resolve(domainURL.host, {
          allowHttp: true,
        })
      : await StellarTomlResolver.resolve(domainURL.host);

  if (!toml.CURRENCIES) {
    throw new Error(
      "the home domain specified does not have a CURRENCIES section on it's TOML file",
    );
  }

  const matchingCurrency = toml.CURRENCIES.find(
    (c: any) => c.code === assetCode,
  );

  if (!matchingCurrency?.issuer) {
    const availableAssets = toml.CURRENCIES.map((c: any) => c.code).join(", ");

    throw new Error(
      `Unable to find the ${assetCode} issuer on the home domain's TOML file.
      Available asset${
        toml.CURRENCIES.length > 1 ? "s" : ""
      }: ${availableAssets}`,
    );
  }

  return matchingCurrency.issuer;
};
