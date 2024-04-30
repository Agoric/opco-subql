import { Balances } from '../../types';
import { b64decode } from '../utils';
import { CosmosEvent } from '@subql/types-cosmos';

interface Attribute {
  key: string;
  value: string;
}

export interface DecodedEvent {
  type: string;
  attributes: Attribute[];
}
export const balancesEventKit = () => {
  function getAttributeValue(decodedData: DecodedEvent, key: string) {
    const attribute = decodedData.attributes.find((attr) => attr.key === key);
    return attribute ? attribute.value : null;
  }

  function decodeEvent(cosmosEvent: CosmosEvent): DecodedEvent {
    const { event } = cosmosEvent;

    const decodedData: DecodedEvent = {
      type: event.type,
      attributes: [],
    };

    event.attributes.forEach((attribute) => {
      const decodedKey = b64decode(attribute.key);
      const decodedValue = b64decode(attribute.value);

      decodedData.attributes.push({
        key: decodedKey,
        value: decodedValue,
      });
    });

    return decodedData;
  }

  async function addressExists(address: string): Promise<boolean> {
    const balance = await Balances.getByAddress(address);
    if (balance?.length === 0) {
      return false;
    }
    return true;
  }

  async function createBalancesEntry(address: string) {
    const newBalance = new Balances(address);
    newBalance.address = address;
    newBalance.balance = BigInt(0);
    newBalance.denom = '';

    await newBalance.save();

    logger.info(`Created new entry for address: ${address}`);
  }

  async function updateBalances(
    senderAddress: string,
    recipientAddress: string,
    amount: bigint
  ): Promise<void> {
    const senderBalances = await Balances.getByAddress(senderAddress);
    const recipientBalances = await Balances.getByAddress(recipientAddress);

    if (!senderBalances || senderBalances.length === 0) {
      logger.error(`Sender balance not found for address: ${senderAddress}`);
      return;
    }

    if (!recipientBalances || recipientBalances.length === 0) {
      logger.error(
        `Recipient balance not found for address: ${recipientAddress}`
      );
      return;
    }

    const senderBalance = senderBalances[0];
    const recipientBalance = recipientBalances[0];

    const senderCurrentBalance = senderBalance.balance ?? BigInt(0);
    const recipientCurrentBalance = recipientBalance.balance ?? BigInt(0);

    senderBalance.balance = senderCurrentBalance - amount;
    recipientBalance.balance = recipientCurrentBalance + amount;

    await senderBalance.save();
    await recipientBalance.save();

    logger.info(
      `Updated balances: Sender ${senderAddress} balance: ${senderBalance.balance}, Recipient ${recipientAddress} balance: ${recipientBalance.balance}`
    );
  }

  return {
    getAttributeValue,
    decodeEvent,
    addressExists,
    createBalancesEntry,
    updateBalances,
  };
};
