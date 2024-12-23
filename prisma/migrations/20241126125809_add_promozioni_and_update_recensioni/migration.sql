/*
  Warnings:

  - Added the required column `barbiereId` to the `Recensione` table without a default value. This is not possible if the table is not empty.
  - Added the required column `servizioId` to the `Recensione` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `recensione` ADD COLUMN `barbiereId` VARCHAR(191) NOT NULL,
    ADD COLUMN `servizioId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `Promozione` (
    `id` VARCHAR(191) NOT NULL,
    `titolo` VARCHAR(191) NOT NULL,
    `descrizione` TEXT NOT NULL,
    `sconto` INTEGER NOT NULL,
    `puntiNecessari` INTEGER NOT NULL DEFAULT 0,
    `tipo` ENUM('POINTS', 'SEASONAL', 'SPECIAL') NOT NULL DEFAULT 'SEASONAL',
    `validoDal` DATETIME(3) NOT NULL,
    `validoAl` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Promozione_validoDal_validoAl_idx`(`validoDal`, `validoAl`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Recensione` ADD CONSTRAINT `Recensione_servizioId_fkey` FOREIGN KEY (`servizioId`) REFERENCES `Servizio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Recensione` ADD CONSTRAINT `Recensione_barbiereId_fkey` FOREIGN KEY (`barbiereId`) REFERENCES `Barbiere`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
