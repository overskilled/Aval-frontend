# Aval — Guide d'Intégration Blockchain

> **Objectif :** ajouter une couche d'ancrage blockchain au système Aval pour passer d'une **confiance centralisée** (signatures HMAC stockées dans une base PostgreSQL) à une **confiance vérifiable publiquement et immuable**, sans rompre le flux de vérification existant.

---

## 1. Résumé exécutif

Aval signe déjà chaque code produit avec un HMAC-SHA256 dérivé d'une clé propre à chaque institution (`SigningKey.secretHex`). Cette cryptographie est solide, mais la confiance repose entièrement sur :

- L'intégrité de la base PostgreSQL (Neon)
- La non-compromission des clés HMAC stockées côté serveur
- La disponibilité du backend Aval pour répondre aux vérifications

**Une intégration blockchain élimine ces trois points de défaillance** en publiant pour chaque lot (`Batch`) une empreinte cryptographique (Merkle root) sur un registre public, immuable, horodaté, et auditable par n'importe qui — y compris hors de l'écosystème Aval.

---

## 2. Comprendre la blockchain en 3 idées (pour ce contexte)

| Concept | Définition courte | Pertinence pour Aval |
|---|---|---|
| **Ledger distribué** | Base de données dont l'historique ne peut pas être modifié rétroactivement sans contrôler la majorité du réseau | Garantit qu'un fabricant ne peut pas "réécrire" l'histoire de ses lots |
| **Smart contract** | Programme s'exécutant sur la blockchain, déterministe, public, dont l'état est visible par tous | Sert de **registre public de batches** consultable par les citoyens, le gouvernement, et toute partie |
| **Hash / Merkle root** | Empreinte cryptographique compacte d'un grand ensemble de données | Permet d'**ancrer 1 million de codes en publiant une seule valeur de 32 octets** sur la blockchain |

⚠️ **Ce que la blockchain N'EST PAS** :
- Une base de données performante (lente, chère par écriture)
- Un système de stockage de fichiers (on ne met JAMAIS les codes complets onchain)
- Une solution magique anti-contrefaçon (elle complète la cryptographie existante, ne la remplace pas)

---

## 3. Architecture cible

### 3.1 Principe directeur : Merkle anchoring

**Ne JAMAIS publier les codes individuels sur la blockchain.** Pour un batch de 10 000 produits :

1. Construire un **arbre de Merkle** dont les feuilles sont les `serialHash` de tous les codes du batch.
2. Calculer la **racine de Merkle** (32 octets).
3. Publier sur la blockchain : `{ batchId, merkleRoot, totalCodes, institutionId, timestamp }`.
4. Stocker la **preuve de Merkle** (Merkle proof) pour chaque code dans la base Postgres (~log₂(N) × 32 octets par code).

Résultat : une seule transaction blockchain par batch suffit à ancrer des millions de produits, et chaque code peut être prouvé indépendamment.

### 3.2 Schéma global

```
┌─────────────────────────────────────────────────────────────────────┐
│                          AVAL EXISTANT                              │
│                                                                     │
│  POST /batches/:id/generate                                         │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────┐    HMAC-SHA256    ┌──────────────────────────┐    │
│  │   Batch      │ ────────────────▶ │  Code table (Postgres)   │    │
│  │ generation   │                   │  serialHash, signature   │    │
│  └──────────────┘                   └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼  (NOUVEAU : couche blockchain)
┌─────────────────────────────────────────────────────────────────────┐
│                       NOUVEAU MODULE                                │
│                                                                     │
│  ┌──────────────────┐   ┌──────────────────┐                        │
│  │ MerkleTree       │──▶│ BlockchainAnchor │ (table Postgres)       │
│  │ builder          │   │ + MerkleProof    │                        │
│  └──────────────────┘   └──────────────────┘                        │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────────┐    publish     ┌──────────────────────────┐   │
│  │ AnchorService    │ ─────────────▶ │  Smart Contract          │   │
│  │ (ethers.js)      │                │  AvalRegistry.sol        │   │
│  └──────────────────┘                │  on Polygon PoS          │   │
│                                      └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  POST /verify (existant, amélioré)                                  │
│     1. Vérifie HMAC signature       ◀── déjà fait                   │
│     2. Vérifie Merkle proof         ◀── NOUVEAU                     │
│     3. Vérifie onchain root         ◀── NOUVEAU                     │
│                                                                     │
│  Réponse enrichie : { valid, signatureValid, onchainValid, txHash } │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Choix de la blockchain

| Option | Avantages | Inconvénients | Recommandation |
|---|---|---|---|
| **Ethereum L1** | Sécurité maximale, écosystème mature | Coût prohibitif (~5-50 $ par transaction) | ❌ Non |
| **Polygon PoS** | Très bon marché (~0.001 $/tx), EVM-compatible, mature, africain-friendly (faibles coûts) | Plus centralisé qu'Ethereum | ✅ **Recommandé pour démarrer** |
| **Polygon zkEVM** | Sécurité héritée d'Ethereum, EVM-compatible | Moins mature, plus cher que PoS | ✅ Pour V2 |
| **Hyperledger Fabric** | Permissioned, conforme régulation, performant | Pas de vérification publique, complexe à opérer | ⚠️ Si exigence gouvernementale stricte |
| **Hedera Hashgraph** | Très rapide, frais fixes, gouvernance d'entreprise | Écosystème plus petit | ⚠️ Alternative valable |

**Recommandation pour Aval V1 : Polygon PoS testnet (Amoy) → mainnet.**

Justifications :
- Coût quasi-nul à l'échelle des volumes Aval (1 transaction ≈ 0,0001 USD)
- EVM-compatible → outils standards (ethers.js, Hardhat, OpenZeppelin)
- Vérifiable publiquement par tout citoyen via Polygonscan
- Pont vers Ethereum si besoin de prestige/sécurité accrue plus tard

---

## 5. Modèle de données — Extensions Prisma

Ajouter au schéma existant :

```prisma
model BlockchainAnchor {
  id              String   @id @default(cuid())
  batchId         String   @unique
  batch           Batch    @relation(fields: [batchId], references: [id])

  merkleRoot      String                                  // 0x... (32 bytes hex)
  totalCodes      Int
  chainId         Int                                     // 137 = Polygon mainnet
  contractAddress String
  txHash          String   @unique                        // 0x... (66 chars)
  blockNumber     BigInt?
  gasUsed         BigInt?
  status          AnchorStatus @default(PENDING)

  publishedAt     DateTime?
  confirmedAt     DateTime?                               // après N confirmations
  createdAt       DateTime @default(now())

  @@index([status])
  @@index([merkleRoot])
}

enum AnchorStatus {
  PENDING       // construit, en attente d'envoi
  BROADCASTED   // tx envoyée
  CONFIRMED     // N confirmations atteintes
  FAILED        // échec irréversible
}

model MerkleProof {
  id        String   @id @default(cuid())
  codeId    String   @unique
  code      Code     @relation(fields: [codeId], references: [id])
  anchorId  String
  anchor    BlockchainAnchor @relation(fields: [anchorId], references: [id])

  // Chemin de preuve : array de hash siblings du leaf à la racine
  // Stocké en JSON pour flexibilité : ["0xabc...", "0xdef...", ...]
  proof     Json
  leafIndex Int                                           // position du leaf dans l'arbre
}
```

Et ajouter sur le modèle `Batch` existant :

```prisma
model Batch {
  // ... champs existants
  anchor     BlockchainAnchor?
}
```

---

## 6. Smart Contract — `AvalRegistry.sol`

Contrat minimaliste, sans logique métier complexe. Tout le métier reste off-chain.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title Aval Batch Registry
/// @notice Anchors product batch Merkle roots for tamper-proof verification.
contract AvalRegistry is AccessControl {
    bytes32 public constant PUBLISHER_ROLE = keccak256("PUBLISHER_ROLE");

    struct BatchAnchor {
        bytes32 merkleRoot;
        uint32  totalCodes;
        bytes32 institutionId;   // keccak256 of internal institution UUID
        uint64  timestamp;
        address publisher;
    }

    // batchId (keccak256 of internal UUID) -> anchor
    mapping(bytes32 => BatchAnchor) private _anchors;

    event BatchAnchored(
        bytes32 indexed batchId,
        bytes32 indexed institutionId,
        bytes32 merkleRoot,
        uint32  totalCodes,
        uint64  timestamp
    );

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PUBLISHER_ROLE, admin);
    }

    /// @notice Publish anchor for a batch. Immutable once written.
    function anchorBatch(
        bytes32 batchId,
        bytes32 institutionId,
        bytes32 merkleRoot,
        uint32  totalCodes
    ) external onlyRole(PUBLISHER_ROLE) {
        require(_anchors[batchId].timestamp == 0, "Batch already anchored");
        require(merkleRoot != bytes32(0),          "Root cannot be zero");
        require(totalCodes > 0,                    "Empty batch");

        _anchors[batchId] = BatchAnchor({
            merkleRoot:    merkleRoot,
            totalCodes:    totalCodes,
            institutionId: institutionId,
            timestamp:     uint64(block.timestamp),
            publisher:     msg.sender
        });

        emit BatchAnchored(batchId, institutionId, merkleRoot, totalCodes, uint64(block.timestamp));
    }

    /// @notice View an anchor.
    function getAnchor(bytes32 batchId) external view returns (BatchAnchor memory) {
        return _anchors[batchId];
    }

    /// @notice Verify a Merkle proof against a known batch.
    function verifyCode(
        bytes32 batchId,
        bytes32 leaf,
        bytes32[] calldata proof
    ) external view returns (bool) {
        BatchAnchor memory a = _anchors[batchId];
        if (a.timestamp == 0) return false;

        bytes32 computed = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 p = proof[i];
            computed = computed < p
                ? keccak256(abi.encodePacked(computed, p))
                : keccak256(abi.encodePacked(p, computed));
        }
        return computed == a.merkleRoot;
    }
}
```

**Points clés du contrat :**

- `anchorBatch` est **idempotent** : impossible de réécrire un batch déjà ancré
- L'arbre de Merkle utilise **keccak256** avec ordre canonique (`a < b ? hash(a,b) : hash(b,a)`) — identique à la lib `merkletreejs`
- Le rôle `PUBLISHER_ROLE` permet d'avoir un wallet backend dédié, distinct du wallet admin (sécurité)
- Les événements `BatchAnchored` permettent à n'importe quel observateur de reconstituer l'état complet via les logs

---

## 7. Module NestJS — Implémentation

### 7.1 Dépendances à installer

```bash
cd Aval-backend
npm install ethers @openzeppelin/contracts merkletreejs
npm install -D hardhat @nomicfoundation/hardhat-toolbox
```

### 7.2 Service Merkle (construction de l'arbre)

```typescript
// src/blockchain/merkle.service.ts
import { Injectable } from '@nestjs/common';
import { MerkleTree } from 'merkletreejs';
import { keccak256 } from 'ethers';

@Injectable()
export class MerkleService {
  /**
   * Builds a Merkle tree from serial hashes.
   * @param serialHashes - array of 32-byte hex strings (from Code.serialHash)
   */
  buildTree(serialHashes: string[]): MerkleTree {
    const leaves = serialHashes.map(h => Buffer.from(h.replace(/^0x/, ''), 'hex'));
    return new MerkleTree(leaves, (data: Buffer) =>
      Buffer.from(keccak256(data).slice(2), 'hex'),
      { sortPairs: true }   // CRITICAL: matches the Solidity verification logic
    );
  }

  getRoot(tree: MerkleTree): string {
    return '0x' + tree.getRoot().toString('hex');
  }

  getProof(tree: MerkleTree, leaf: string): string[] {
    const leafBuf = Buffer.from(leaf.replace(/^0x/, ''), 'hex');
    return tree.getProof(leafBuf).map(p => '0x' + p.data.toString('hex'));
  }
}
```

### 7.3 Service d'ancrage (publication onchain)

```typescript
// src/blockchain/anchor.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MerkleService } from './merkle.service';
import AvalRegistryAbi from './abi/AvalRegistry.json';

@Injectable()
export class AnchorService {
  private readonly logger = new Logger(AnchorService.name);
  private readonly contract: ethers.Contract;
  private readonly wallet: ethers.Wallet;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly merkle: MerkleService,
  ) {
    const provider = new ethers.JsonRpcProvider(this.config.get('RPC_URL'));
    this.wallet = new ethers.Wallet(this.config.get('PUBLISHER_PRIVATE_KEY'), provider);
    this.contract = new ethers.Contract(
      this.config.get('AVAL_REGISTRY_ADDRESS'),
      AvalRegistryAbi,
      this.wallet,
    );
  }

  async anchorBatch(batchId: string): Promise<string> {
    const batch = await this.prisma.batch.findUniqueOrThrow({
      where: { id: batchId },
      include: { codes: { select: { id: true, serialHash: true } }, sku: true },
    });

    if (batch.codes.length === 0) {
      throw new Error('Cannot anchor empty batch');
    }

    // 1) Build Merkle tree
    const hashes = batch.codes.map(c => c.serialHash);
    const tree = this.merkle.buildTree(hashes);
    const root = this.merkle.getRoot(tree);

    // 2) Compute deterministic IDs onchain
    const batchIdBytes32      = ethers.id(batch.id);          // keccak256(batch.id)
    const institutionIdBytes32 = ethers.id(batch.sku.institutionId);

    // 3) Create PENDING record FIRST (for crash safety)
    const anchor = await this.prisma.blockchainAnchor.create({
      data: {
        batchId: batch.id,
        merkleRoot: root,
        totalCodes: batch.codes.length,
        chainId: Number(this.config.get('CHAIN_ID')),
        contractAddress: this.contract.target as string,
        txHash: '',                                          // filled after broadcast
        status: 'PENDING',
      },
    });

    // 4) Broadcast transaction
    let tx: ethers.TransactionResponse;
    try {
      tx = await this.contract.anchorBatch(
        batchIdBytes32,
        institutionIdBytes32,
        root,
        batch.codes.length,
      );
    } catch (e) {
      await this.prisma.blockchainAnchor.update({
        where: { id: anchor.id },
        data: { status: 'FAILED' },
      });
      throw e;
    }

    // 5) Persist tx hash immediately + queue confirmation watch
    await this.prisma.blockchainAnchor.update({
      where: { id: anchor.id },
      data: { txHash: tx.hash, status: 'BROADCASTED', publishedAt: new Date() },
    });

    // 6) Persist Merkle proofs for all codes (batched)
    const proofData = batch.codes.map((c, idx) => ({
      codeId:    c.id,
      anchorId:  anchor.id,
      proof:     this.merkle.getProof(tree, c.serialHash),
      leafIndex: idx,
    }));
    await this.prisma.merkleProof.createMany({ data: proofData });

    // 7) Wait for confirmations (separate worker in production)
    this.waitForConfirmation(tx, anchor.id).catch(err =>
      this.logger.error(`Confirmation watch failed for ${anchor.id}`, err),
    );

    return tx.hash;
  }

  private async waitForConfirmation(
    tx: ethers.TransactionResponse,
    anchorId: string,
  ): Promise<void> {
    const receipt = await tx.wait(3); // wait 3 confirmations on Polygon
    if (!receipt) return;

    await this.prisma.blockchainAnchor.update({
      where: { id: anchorId },
      data: {
        status:      'CONFIRMED',
        blockNumber: receipt.blockNumber,
        gasUsed:     receipt.gasUsed,
        confirmedAt: new Date(),
      },
    });
  }
}
```

### 7.4 Endpoint de vérification enrichi

Le `/verify` existant garde sa signature mais retourne maintenant une preuve onchain :

```typescript
// src/verify/verify.controller.ts (excerpt)
@Post()
@Throttle(30, 60)
async verify(@Body() dto: VerifyDto) {
  // 1) Existing HMAC verification
  const { code, signatureValid } = await this.verifyService.verifyHmac(dto.token);
  if (!signatureValid) {
    return { valid: false, reason: 'INVALID_SIGNATURE' };
  }

  // 2) NEW: Onchain Merkle proof verification
  const proof  = await this.prisma.merkleProof.findUnique({
    where: { codeId: code.id },
    include: { anchor: true },
  });

  let onchainValid = false;
  let txHash: string | null = null;

  if (proof && proof.anchor.status === 'CONFIRMED') {
    onchainValid = await this.anchorService.verifyOnchain(
      code.batchId,
      code.serialHash,
      proof.proof as string[],
    );
    txHash = proof.anchor.txHash;
  }

  return {
    valid:           signatureValid && onchainValid,
    signatureValid,                                   // legacy guarantee
    onchainValid,                                     // new guarantee
    txHash,                                           // for public audit on Polygonscan
    batch: { id: code.batchId, sku: code.sku.name },
  };
}
```

---

## 8. Variables d'environnement à ajouter

```bash
# .env (Aval-backend)

# Polygon Amoy testnet (start here)
RPC_URL=https://rpc-amoy.polygon.technology
CHAIN_ID=80002
AVAL_REGISTRY_ADDRESS=0x...                 # deployed via Hardhat
PUBLISHER_PRIVATE_KEY=0x...                 # NEVER commit this

# For Polygon mainnet (production)
# RPC_URL=https://polygon-rpc.com
# CHAIN_ID=137

# Optional: backup RPC for resilience
RPC_URL_FALLBACK=https://polygon-amoy.g.alchemy.com/v2/<API_KEY>
```

🚨 **Sécurité critique** : la `PUBLISHER_PRIVATE_KEY` doit être stockée dans un secret manager (AWS Secrets Manager, HashiCorp Vault, Doppler) — **jamais** en clair dans le `.env` de production. Pour V1 sur testnet, le `.env` local est acceptable.

---

## 9. Plan de déploiement par phases

### Phase 1 — Proof of concept (testnet) [2-3 semaines]

1. Déployer `AvalRegistry.sol` sur Polygon Amoy testnet via Hardhat
2. Ajouter les modèles Prisma + migration (sans casser les données existantes)
3. Implémenter `MerkleService` + tests unitaires (vérifier alignement avec OpenZeppelin)
4. Implémenter `AnchorService` avec mode "shadow" : ancrer en parallèle sans modifier `/verify`
5. Ancrer manuellement 1-2 batches de test, vérifier sur https://amoy.polygonscan.com

### Phase 2 — Intégration verify endpoint [1-2 semaines]

1. Modifier `/verify` pour exposer `onchainValid` + `txHash` SANS bloquer si offchain (rétro-compatibilité)
2. Ajouter dashboard admin pour visualiser le statut des ancrages
3. Tests end-to-end : génération batch → ancrage → scan QR → vérification onchain

### Phase 3 — Mainnet [1 semaine]

1. Audit du smart contract (au minimum revue par un dev Solidity senior, idéalement audit professionnel pour un déploiement public)
2. Déploiement sur Polygon mainnet
3. Migration des batches existants (optionnel, gros effort) : reconstruire les arbres de Merkle pour les batches déjà émis et les ancrer rétroactivement
4. Mettre à jour la page citoyenne avec un lien Polygonscan "voir la preuve onchain"

### Phase 4 — Améliorations [continuel]

- Worker dédié pour le suivi des confirmations (Bull/BullMQ + Redis)
- Mécanisme de retry avec gas bumping pour les tx coincées
- Indexation locale des événements via TheGraph pour rapidité
- Support multi-chain (Base, Arbitrum) pour redondance

---

## 10. Coûts estimés

Calculs basés sur Polygon PoS aux conditions de mai 2026 (~30 gwei gas, MATIC ≈ 0,70 $) :

| Opération | Gas estimé | Coût en MATIC | Coût en USD |
|---|---|---|---|
| Déploiement contrat (one-shot) | ~600 000 | ~0.018 | ~0.013 $ |
| `anchorBatch` (par batch) | ~80 000 | ~0.0024 | ~0.0017 $ |
| `verifyCode` (view, gratuit) | 0 | 0 | 0 $ |

→ Pour **10 000 batches/an**, coût total ≈ **17 USD/an**. Négligeable.

---

## 11. Pièges à éviter

| Piège | Conséquence | Mitigation |
|---|---|---|
| Stocker les codes complets onchain | Coût explose, fuite de données | Ne stocker QUE les hashes via Merkle root |
| Utiliser SHA-256 dans le Merkle | Incompatible avec la fonction de vérification Solidity | Toujours utiliser keccak256 côté off-chain |
| Oublier `sortPairs: true` dans merkletreejs | Les preuves ne correspondent pas à la logique du contrat | Bien configurer la lib |
| Publier la `PUBLISHER_PRIVATE_KEY` | Vol du contrôle du contrat | Secret manager + rotation périodique |
| Pas attendre les confirmations | Réorganisation de chaîne = preuve invalide | Attendre au moins 3 confirmations sur Polygon |
| Confondre testnet et mainnet | Ancrer en prod sur testnet = preuve non vérifiable | Variable `CHAIN_ID` + checks au démarrage |
| Anchorer un batch vide ou partiel | Tx réussie mais inutile | Verrouiller la génération avant ancrage |
| Réutiliser un même batchId | Le contrat rejette par design — mais bug applicatif probable | `batch.id` UUID = collision impossible |

---

## 12. Bénéfices côté business (pour la présentation au client/régulateur)

- ✅ **Tamper-proof** : aucun acteur, pas même Aval, ne peut modifier l'historique des batches publiés
- ✅ **Transparence régulatoire** : COBAC / ministère de la santé peut auditer en temps réel sans demander d'accès à la BD Aval
- ✅ **Citoyen empowered** : possibilité de vérifier un produit même si le site Aval est hors ligne (via Polygonscan + appli tiers)
- ✅ **Différenciateur commercial** : les fabricants peuvent communiquer *"Authentifié sur la blockchain"* — argument marketing fort
- ✅ **Évolutif** : ouvre la voie à des fonctionnalités V2 (NFT de garantie, traçabilité supply chain, transferts de propriété)

---

## 13. Roadmap de tickets concrets

Voici 12 tickets prêts à être ajoutés à un backlog :

1. `[infra]` Initialiser Hardhat dans `Aval-backend/contracts/`
2. `[contract]` Implémenter et tester `AvalRegistry.sol` (unit + fuzz)
3. `[infra]` Script de déploiement Hardhat (testnet + mainnet)
4. `[db]` Migration Prisma : ajouter `BlockchainAnchor` + `MerkleProof`
5. `[backend]` `MerkleService` avec tests d'alignement OpenZeppelin
6. `[backend]` `AnchorService` (publication + suivi confirmation)
7. `[backend]` Endpoint `POST /batches/:id/anchor` (admin only)
8. `[backend]` Modification de `POST /verify` pour retourner `onchainValid`
9. `[security]` Intégrer un secret manager pour `PUBLISHER_PRIVATE_KEY`
10. `[ops]` Worker BullMQ pour retry/confirmation des tx
11. `[frontend]` Ajouter sur la page citoyenne le lien Polygonscan + badge "vérifié onchain"
12. `[docs]` Page publique expliquant la garantie blockchain aux consommateurs

---

## 14. Pour aller plus loin

- **OpenZeppelin Docs** — patterns standards de smart contracts : https://docs.openzeppelin.com
- **Polygon Developer Hub** — RPC publics, faucets testnet : https://polygon.technology/developers
- **MerkleTree.js** — librairie utilisée côté off-chain : https://github.com/merkletreejs/merkletreejs
- **Hardhat** — framework de dev/test/déploiement Solidity : https://hardhat.org
- **EIP-1186** — standard de Merkle proof Ethereum, utile pour V2
- **TheGraph** — pour indexer rapidement les événements `BatchAnchored` côté frontend

---

## 15. TL;DR

> Aval utilise déjà HMAC-SHA256 pour signer chaque produit. La blockchain ajoute une **couche d'ancrage public et immuable** sans rien casser : on construit un arbre de Merkle par batch, on publie sa racine sur Polygon (~0,002 $ par batch), et le endpoint `/verify` retourne une preuve cryptographique vérifiable par tous. L'implémentation tient en un smart contract de 80 lignes et un nouveau module NestJS. Déploiement sur testnet en 2-3 semaines, mainnet ensuite.

---

*Document généré pour le projet Aval — overskilled/Aval-backend & overskilled/Aval-frontend.*
