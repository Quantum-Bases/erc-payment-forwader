-- CreateTable
CREATE TABLE "Trnasections" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "recpient" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "createTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trnasections_pkey" PRIMARY KEY ("id")
);
