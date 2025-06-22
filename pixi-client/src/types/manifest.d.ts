// Type declaration for Dojo manifest file
declare module "*.json" {
  interface Contract {
    address: string;
    tag: string;
    // Add other contract properties as needed
  }

  interface World {
    address: string;
    // Add other world properties as needed
  }

  interface Manifest {
    contracts: Contract[];
    world: World;
    // Add other manifest properties as needed
  }

  const value: Manifest;
  export default value;
}
