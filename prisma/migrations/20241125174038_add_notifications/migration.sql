-- CreateTable
CREATE TABLE `Notifica` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` ENUM('PRENOTAZIONE', 'PUNTI', 'SISTEMA') NOT NULL,
    `messaggio` TEXT NOT NULL,
    `letta` BOOLEAN NOT NULL DEFAULT false,
    `utenteId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Notifica_utenteId_idx`(`utenteId`),
    INDEX `Notifica_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Notifica` ADD CONSTRAINT `Notifica_utenteId_fkey` FOREIGN KEY (`utenteId`) REFERENCES `Utente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
