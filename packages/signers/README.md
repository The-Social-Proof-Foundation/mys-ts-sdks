# Mys KMS Signers

The Mys KMS Signers package provides a set of tools for securely signing transactions using Key
Management Services (KMS) like AWS KMS and GCP KMS.

## Table of Contents

- [Mys KMS Signers](#mys-kms-signers)
  - [Table of Contents](#table-of-contents)
  - [AWS KMS Signer](#aws-kms-signer)
    - [Usage](#usage)
    - [API](#api)
      - [fromKeyId](#fromkeyid)
        - [Parameters](#parameters)
        - [Examples](#examples)
  - [GCP KMS Signer](#gcp-kms-signer)
    - [Usage](#usage-1)
      - [fromOptions](#fromoptions)
        - [Parameters](#parameters-1)
        - [Examples](#examples-1)
  - [Ledger Signer](#ledger-signer)
    - [Usage](#usage-2)
      - [fromDerivationPath](#fromderivationpath)
        - [Parameters](#parameters-2)
        - [Examples](#examples-2)

## AWS KMS Signer

The AWS KMS Signer allows you to leverage AWS's Key Management Service to sign Mys transactions.

### Usage

```typescript
import { AwsKmsSigner } from '@socialproof/signers/aws';

const prepareSigner = async () => {
	const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_KMS_KEY_ID } = process.env;

	return AwsKmsSigner.fromKeyId(AWS_KMS_KEY_ID, {
		region: AWS_REGION,
		accessKeyId: AWS_ACCESS_KEY_ID,
		secretAccessKey: AWS_SECRET_ACCESS_KEY,
	});
};
```

### API

#### fromKeyId

Create an AWS KMS signer from AWS Key ID and AWS credentials. This method initializes the signer
with the necessary AWS credentials and region information, allowing it to interact with AWS KMS to
perform cryptographic operations.

##### Parameters

- `keyId`
  **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**
  The AWS KMS key ID.
- `options`
  **[object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** An
  object containing AWS credentials and region.
  - `region`
    **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**
    The AWS region.
  - `accessKeyId`
    **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**
    The AWS access key ID.
  - `secretAccessKey`
    **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**
    The AWS secret access key.

##### Examples

```typescript
const signer = await AwsKmsSigner.fromKeyId('your-kms-key-id', {
	region: 'us-west-2',
	accessKeyId: 'your-access-key-id',
	secretAccessKey: 'your-secret-access-key',
});
```

Returns
**[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[AwsKmsSigner](https://github.com/The-Social-Proof-Foundation/mys-ts-sdks/blob/main/packages/signers/src/aws/aws-kms-signer.ts)>**
An instance of AwsKmsSigner.

**Notice**: AWS Signer requires Node >=20 due to dependency on `crypto`

## GCP KMS Signer

The GCP KMS Signer allows you to leverage Google Cloud's Key Management Service to sign Mys
transactions.

### Usage

#### fromOptions

Create a GCP KMS signer from the provided options. This method initializes the signer with the
necessary GCP credentials and configuration, allowing it to interact with GCP KMS to perform
cryptographic operations.

##### Parameters

- `options`
  **[object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** An
  object containing GCP credentials and configuration.
  - `projectId`
    **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**
    The GCP project ID.
  - `location`
    **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**
    The GCP location.
  - `keyRing`
    **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**
    The GCP key ring.
  - `cryptoKey`
    **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**
    The GCP crypto key.
  - `cryptoKeyVersion`
    **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**
    The GCP crypto key version.

##### Examples

```typescript
const signer = await GcpKmsSigner.fromOptions({
	projectId: 'your-google-project-id',
	location: 'your-google-location',
	keyRing: 'your-google-keyring',
	cryptoKey: 'your-google-key-name',
	cryptoKeyVersion: 'your-google-key-name-version',
});

// Retrieve the public key and get the Mys address
const publicKey = signer.getPublicKey();
console.log(publicKey.toMysAddress());

// Define a test message
const testMessage = 'Hello, GCP KMS Signer!';
const messageBytes = new TextEncoder().encode(testMessage);

// Sign the test message
const { signature } = await signer.signPersonalMessage(messageBytes);

// Verify the signature against the public key
const isValid = await publicKey.verifyPersonalMessage(messageBytes, signature);
console.log(isValid); // Should print true if the signature is valid
```

## Ledger Signer

The Ledger Signer allows you to leverage a Ledger hardware wallet to sign Mys transactions.

### Usage

#### fromDerivationPath

Creates a Ledger signer from the provided options. This method initializes the signer with the
necessary configuration, allowing it to interact with a Ledger hardare wallet to perform
cryptographic operations.

##### Parameters

- `options`
  **[object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** An
  object containing GCP credentials and configuration.
  - `projectId`
    **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**
    The GCP project ID.

##### Examples

```typescript
import Transport from '@ledgerhq/hw-transport-node-hid';
import MysLedgerClient from '@socialproof/ledgerjs-hw-app-mys';
import { LedgerSigner } from '@socialproof/signers/ledger';
import { getFullnodeUrl, MysClient } from '@socialproof/mys/client';
import { Transaction } from '@socialproof/mys/transactions';

const transport = await Transport.open(undefined);
const ledgerClient = new MysLedgerClient(transport);
const mysClient = new MysClient({ url: getFullnodeUrl('testnet') });

const signer = await LedgerSigner.fromDerivationPath(
	"m/44'/784'/0'/0'/0'",
	ledgerClient,
	mysClient,
);

// Log the Mys address:
console.log(signer.toMysAddress());

// Define a test transaction:
const testTransaction = new Transaction();
const transactionBytes = await testTransaction.build();

// Sign a test transaction:
const { signature } = await signer.signTransaction(transactionBytes);
console.log(signature);
```
