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

export enum Operation {
  Increment = 'increment',
  Decrement = 'decrement',
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

    if (!balance || balance.length === 0) {
      return false;
    }
    return true;
  }

  async function createBalancesEntry(address: string) {
    const newBalance = new Balances(address);
    newBalance.address = address;
    newBalance.balance = BigInt(0);
    newBalance.denom = 'ubld';

    await newBalance.save();

    logger.info(`Created new entry for address: ${address}`);
  }

  function isBLDTransaction(amount: string) {
    if (amount.slice(-4) === 'ubld') {
      return true;
    }
    return false;
  }

  async function updateBalance(
    address: string,
    amount: bigint,
    operation: Operation
  ): Promise<void> {
    const balances = await Balances.getByAddress(address);

    if (!balances || balances.length === 0) {
      logger.error(`Balance not found for address: ${address}`);
      return;
    }

    const balance = balances[0];
    const currentBalance = balance.balance ?? BigInt(0);
    let newBalance: bigint;

    if (operation === Operation.Increment) {
      newBalance = currentBalance + amount;
      balance.balance = newBalance;
      logger.info(
        `Incremented balance for ${address} by ${amount}. New balance: ${balance.balance}`
      );
    } else if (operation === Operation.Decrement) {
      newBalance = currentBalance - amount;
      if (newBalance < 0) {
        logger.error(
          `Attempt to decrement ${amount} would result in a negative balance. Current balance: ${currentBalance}.`
        );
        return;
      }
      balance.balance = newBalance;
      logger.info(
        `Decremented balance for ${address} by ${amount}. New balance: ${balance.balance}`
      );
    }

    await balance.save();
  }

  return {
    isBLDTransaction,
    getAttributeValue,
    decodeEvent,
    addressExists,
    createBalancesEntry,
    updateBalance,
  };
};
