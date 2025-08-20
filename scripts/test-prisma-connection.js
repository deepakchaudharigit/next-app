#!/usr/bin/env node

/**
 * Test script to verify Prisma client connection
 * This helps debug Docker container issues
 */

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('🔍 Testing Prisma client connection...');
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // Test basic connection
    console.log('📡 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Test query execution
    console.log('🔍 Testing query execution...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query execution successful:', result);

    // Test if tables exist
    console.log('📋 Checking if tables exist...');
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Users table exists with ${userCount} records`);
    } catch (error) {
      console.log('⚠️  Users table might not exist yet:', error.message);
    }

    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Connection test failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Meta:', error.meta);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();