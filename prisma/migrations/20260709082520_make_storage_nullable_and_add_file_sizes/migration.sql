-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "fileSize" INTEGER;

-- AlterTable
ALTER TABLE "CertificateTemplate" ADD COLUMN     "backgroundImageSize" INTEGER,
ADD COLUMN     "signatureImageSize" INTEGER;

-- AlterTable
ALTER TABLE "InstituteSettings" ADD COLUMN     "bannerSize" INTEGER,
ADD COLUMN     "defaultSealImageSize" INTEGER,
ADD COLUMN     "defaultSignatureImageSize" INTEGER,
ADD COLUMN     "faviconSize" INTEGER,
ADD COLUMN     "logoSize" INTEGER;

-- AlterTable
ALTER TABLE "SubscriptionPlan" ALTER COLUMN "storageLimitGB" DROP NOT NULL;
