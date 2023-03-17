import { generatePrivateKey, getPublicKey } from "nostr-tools";

// those keys are bigger than they should be for some reason
// TODO: figure out why
export let myPrivKey = generatePrivateKey();
export let myPubKey = getPublicKey(myPrivKey);
