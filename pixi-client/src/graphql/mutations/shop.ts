import { gql } from "@apollo/client";

export const PURCHASE_ORB = gql`
  mutation PurchaseOrb($account: String!, $orb_type: String!) {
    createBurnerTransaction(
      account: $account
      calls: [{
        contractAddress: "0x123"  # This will need to be replaced with actual contract address
        entrypoint: "purchase_orb"
        calldata: [$orb_type]
      }]
    ) {
      transactionHash
    }
  }
`;