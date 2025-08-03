import {
  createNft,
  fetchDigitalAsset,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  airdropIfRequired,
  getExplorerLink,
  getKeypairFromFile,
} from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { Connection, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
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

const collectionMint = generateSigner(umi);
console.log("Generated collection mint:", collectionMint.publicKey);
const transaction = await createNft(umi, {
  mint: collectionMint,
  name: "My Collection",
  symbol: "COLL",
  uri: "https://raw.githubusercontent.com/yashvikram30/nft_project/main/metadata.json",
  sellerFeeBasisPoints: percentAmount(0),
  isCollection: true,
});

console.log("Created collection NFT transaction:", transaction);
await transaction.sendAndConfirm(umi);
console.log("Collection NFT created successfully:", collectionMint.publicKey);

await new Promise((resolve) => setTimeout(resolve, 2000));

const createdCollectionNft = await fetchDigitalAsset(
  umi,
  collectionMint.publicKey
);

console.log(
  "Collection NFT details, address is:",
  getExplorerLink("address", createdCollectionNft.mint.publicKey, "devnet")
);
