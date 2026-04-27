import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync } from "@scure/bip39";
import * as btc from "@scure/btc-signer";
import { keccak256 } from "ethereum-cryptography/keccak";
import { secp256k1 } from "ethereum-cryptography/secp256k1";
import { ripemd160 } from "ethereum-cryptography/ripemd160";
import { sha256 } from "ethereum-cryptography/sha256";
import { base58check } from "@scure/base";
import { deriveAddress as xrpDeriveAddress } from "ripple-keypairs";

export type CoinId = "BTC" | "ETH" | "LTC" | "XRP" | "DOGE";

export interface CoinMeta {
  id: CoinId;
  label: string;
}

export const COINS: CoinMeta[] = [
  { id: "BTC", label: "BTC" },
  { id: "ETH", label: "ETH" },
  { id: "LTC", label: "LTC" },
  { id: "XRP", label: "XRP" },
  { id: "DOGE", label: "DOGE" },
];

const b58 = base58check(sha256);

const toHex = (b: Uint8Array) => {
  let s = "";
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, "0");
  return s;
};

const hash160 = (pub: Uint8Array) => ripemd160(sha256(pub));

const deriveBtc = (root: HDKey): string => {
  // Randomly pick Legacy (P2PKH, BIP44) or Native SegWit (P2WPKH, BIP84)
  const useLegacy = Math.random() < 0.5;
  if (useLegacy) {
    const child = root.derive("m/44'/0'/0'/0/0");
    if (!child.publicKey) return "—";
    // P2PKH Bitcoin: version 0x00
    const payload = new Uint8Array(21);
    payload[0] = 0x00;
    payload.set(hash160(child.publicKey), 1);
    return b58.encode(payload);
  }
  const child = root.derive("m/84'/0'/0'/0/0");
  if (!child.publicKey) return "—";
  return btc.p2wpkh(child.publicKey).address ?? "—";
};

const deriveEth = (root: HDKey): string => {
  const child = root.derive("m/44'/60'/0'/0/0");
  if (!child.privateKey) return "—";
  // Uncompressed pubkey, drop 0x04 prefix
  const pub = secp256k1.getPublicKey(child.privateKey, false).slice(1);
  const hash = keccak256(pub);
  return "0x" + toHex(hash.slice(-20));
};

const deriveLtc = (root: HDKey): string => {
  const child = root.derive("m/44'/2'/0'/0/0");
  if (!child.publicKey) return "—";
  // P2PKH Litecoin: version 0x30
  const payload = new Uint8Array(21);
  payload[0] = 0x30;
  payload.set(hash160(child.publicKey), 1);
  return b58.encode(payload);
};

const deriveDoge = (root: HDKey): string => {
  const child = root.derive("m/44'/3'/0'/0/0");
  if (!child.publicKey) return "—";
  // P2PKH Dogecoin: version 0x1e
  const payload = new Uint8Array(21);
  payload[0] = 0x1e;
  payload.set(hash160(child.publicKey), 1);
  return b58.encode(payload);
};

const deriveXrp = (root: HDKey): string => {
  const child = root.derive("m/44'/144'/0'/0/0");
  if (!child.publicKey) return "—";
  const pubHex = toHex(child.publicKey).toUpperCase();
  return xrpDeriveAddress(pubHex);
};

export const deriveAddresses = (
  mnemonic: string,
  coins: CoinId[],
): Record<CoinId, string> => {
  const out = {} as Record<CoinId, string>;
  if (coins.length === 0) return out;
  try {
    const seed = mnemonicToSeedSync(mnemonic);
    const root = HDKey.fromMasterSeed(seed);
    for (const c of coins) {
      try {
        if (c === "BTC") out.BTC = deriveBtc(root);
        else if (c === "ETH") out.ETH = deriveEth(root);
        else if (c === "LTC") out.LTC = deriveLtc(root);
        else if (c === "DOGE") out.DOGE = deriveDoge(root);
        else if (c === "XRP") out.XRP = deriveXrp(root);
      } catch {
        out[c] = "—";
      }
    }
  } catch {
    for (const c of coins) out[c] = "—";
  }
  return out;
};
