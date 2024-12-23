-- CreateTable
CREATE TABLE `Utente` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `cognome` VARCHAR(191) NOT NULL,
    `fotoProfilo` VARCHAR(191) NULL,
    `ruolo` ENUM('ADMIN', 'BARBIERE', 'CLIENTE') NOT NULL DEFAULT 'CLIENTE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Utente_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TokenReset` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `scadenza` DATETIME(3) NOT NULL,
    `utenteId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `TokenReset_token_key`(`token`),
    UNIQUE INDEX `TokenReset_utenteId_key`(`utenteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Barbiere` (
    `id` VARCHAR(191) NOT NULL,
    `utenteId` VARCHAR(191) NOT NULL,
    `specialita` JSON NOT NULL,
    `descrizione` TEXT NULL,

    UNIQUE INDEX `Barbiere_utenteId_key`(`utenteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Servizio` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descrizione` TEXT NOT NULL,
    `durata` INTEGER NOT NULL,
    `prezzo` DECIMAL(10, 2) NOT NULL,
    `categoria` ENUM('TAGLIO', 'BARBA', 'TRATTAMENTO', 'COLORAZIONE', 'COMBO') NOT NULL,
    `immagine` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Servizio_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiziBarbiere` (
    `id` VARCHAR(191) NOT NULL,
    `barbiereId` VARCHAR(191) NOT NULL,
    `servizioId` VARCHAR(191) NOT NULL,
    `prezzo` DECIMAL(10, 2) NULL,

    UNIQUE INDEX `ServiziBarbiere_barbiereId_servizioId_key`(`barbiereId`, `servizioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Prenotazione` (
    `id` VARCHAR(191) NOT NULL,
    `dataOra` DATETIME(3) NOT NULL,
    `stato` ENUM('CONFERMATA', 'COMPLETATA', 'CANCELLATA', 'IN_ATTESA') NOT NULL DEFAULT 'CONFERMATA',
    `note` TEXT NULL,
    `utenteId` VARCHAR(191) NOT NULL,
    `barbiereId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Prenotazione_dataOra_idx`(`dataOra`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PrenotazioneServizio` (
    `id` VARCHAR(191) NOT NULL,
    `prenotazioneId` VARCHAR(191) NOT NULL,
    `servizioId` VARCHAR(191) NOT NULL,
    `prezzo` DECIMAL(10, 2) NOT NULL,

    UNIQUE INDEX `PrenotazioneServizio_prenotazioneId_servizioId_key`(`prenotazioneId`, `servizioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Recensione` (
    `id` VARCHAR(191) NOT NULL,
    `voto` INTEGER NOT NULL DEFAULT 5,
    `commento` TEXT NULL,
    `utenteId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Recensione_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrarioLavoro` (
    `id` VARCHAR(191) NOT NULL,
    `giorno` INTEGER NOT NULL,
    `oraInizio` VARCHAR(191) NOT NULL,
    `oraFine` VARCHAR(191) NOT NULL,
    `barbiereId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `OrarioLavoro_barbiereId_giorno_key`(`barbiereId`, `giorno`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Chiusura` (
    `id` VARCHAR(191) NOT NULL,
    `dataInizio` DATETIME(3) NOT NULL,
    `dataFine` DATETIME(3) NOT NULL,
    `motivo` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Chiusura_dataInizio_dataFine_idx`(`dataInizio`, `dataFine`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TokenReset` ADD CONSTRAINT `TokenReset_utenteId_fkey` FOREIGN KEY (`utenteId`) REFERENCES `Utente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Barbiere` ADD CONSTRAINT `Barbiere_utenteId_fkey` FOREIGN KEY (`utenteId`) REFERENCES `Utente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiziBarbiere` ADD CONSTRAINT `ServiziBarbiere_barbiereId_fkey` FOREIGN KEY (`barbiereId`) REFERENCES `Barbiere`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiziBarbiere` ADD CONSTRAINT `ServiziBarbiere_servizioId_fkey` FOREIGN KEY (`servizioId`) REFERENCES `Servizio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prenotazione` ADD CONSTRAINT `Prenotazione_utenteId_fkey` FOREIGN KEY (`utenteId`) REFERENCES `Utente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prenotazione` ADD CONSTRAINT `Prenotazione_barbiereId_fkey` FOREIGN KEY (`barbiereId`) REFERENCES `Barbiere`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrenotazioneServizio` ADD CONSTRAINT `PrenotazioneServizio_prenotazioneId_fkey` FOREIGN KEY (`prenotazioneId`) REFERENCES `Prenotazione`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrenotazioneServizio` ADD CONSTRAINT `PrenotazioneServizio_servizioId_fkey` FOREIGN KEY (`servizioId`) REFERENCES `Servizio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Recensione` ADD CONSTRAINT `Recensione_utenteId_fkey` FOREIGN KEY (`utenteId`) REFERENCES `Utente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrarioLavoro` ADD CONSTRAINT `OrarioLavoro_barbiereId_fkey` FOREIGN KEY (`barbiereId`) REFERENCES `Barbiere`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
