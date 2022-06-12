export interface AppStorage {
    gallionLabs: Address;
}

export type Address = string;


export function isAddress(address: string): address is Address {
    return address.length === 42 && !!address.match(/^0x[0-9a-fA-F]{40}$/);
}
