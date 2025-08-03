import {
  fetchDigitalAsset,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  airdropIfRequired,
  getExplorerLink,
  getKeypairFromFile,
} from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";
import { createNft } from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
} from "@metaplex-foundation/umi";

const connection = new Connection(clusterApiUrl("devnet"));
const user = await getKeypairFromFile("../../Desktop/wallet-keypair.json");

await airdropIfRequired(
  connection,
  user.publicKey,
  1 * LAMPORTS_PER_SOL,
  0.5 * LAMPORTS_PER_SOL
);

console.log("Loaded user :", user.publicKey.toBase58());

const umi = createUmi(connection.rpcEndpoint);
umi.use(mplTokenMetadata());

const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
umi.use(keypairIdentity(umiUser));
console.log("Set up umi instance for user");

const collectionAddress = publicKey(
  "DRBoZLvRhsMiXeHBY6zxfcdP5BgScntKoRexDfsvZiLZ"
);
console.log("Creating NFT collection with address:", collectionAddress);

const mint = generateSigner(umi);

console.log("Generated mint for NFT:", mint.publicKey);
const transaction = await createNft(umi, {
  mint,
  name: "My NFT",
  symbol: "NFT",
  uri: "https://raw.githubusercontent.com/yashvikram30/nft_project/main/metadata.json",
  sellerFeeBasisPoints: percentAmount(10),
  collection: {
    key: collectionAddress,
    verified: false,
  },
});

console.log("Created NFT transaction:", transaction);
await transaction.sendAndConfirm(umi);

console.log("NFT created successfully:", mint.publicKey);

await new Promise((resolve) => setTimeout(resolve, 8000));

const createdNft = await fetchDigitalAsset(umi, mint.publicKey);
console.log(
  "NFT created successfully:",
  getExplorerLink("address", createdNft.mint.publicKey, "devnet")
);
