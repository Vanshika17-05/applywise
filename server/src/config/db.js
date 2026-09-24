import mongoose from "mongoose";

let connectionPromise;
let ownershipMigrationPromise;

async function migrateApplicationOwnership() {
  if (!ownershipMigrationPromise) {
    ownershipMigrationPromise = mongoose.connection.collection("applications").updateMany(
      { userId: { $exists: false }, user: { $exists: true } },
      [{ $set: { userId: "$user" } }]
    ).then((result) => {
      if (result.modifiedCount) console.info(`Migrated ownership for ${result.modifiedCount} applications`);
    }).catch((error) => {
      ownershipMigrationPromise = undefined;
      throw error;
    });
  }
  await ownershipMigrationPromise;
}

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    await migrateApplicationOwnership();
    return mongoose.connection;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required");
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 10000
    }).then(async () => {
      console.info("MongoDB connected");
      await migrateApplicationOwnership();
      return mongoose.connection;
    }).catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }
  return connectionPromise;
}
