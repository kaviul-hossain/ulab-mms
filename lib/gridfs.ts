import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

let gridFSBucket: GridFSBucket;

export function getGridFSBucket(): GridFSBucket {
  if (!gridFSBucket) {
    const connection = mongoose.connection;
    if (connection.readyState === 1 && connection.db) {
      gridFSBucket = new GridFSBucket(connection.db);
    } else {
      throw new Error('Database not connected');
    }
  }
  return gridFSBucket;
}
