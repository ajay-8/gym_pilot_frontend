#!/usr/bin/env node

/**
 * Gym Pilot Frontend Startup Script with Cache Cleanup
 *
 * This script clears cache and kills old processes before starting Next.js.
 * Use this ONLY when you need a fresh start (debugging cache issues, etc.)
 *
 * Normal usage (fast):      npm run dev
 * With cleanup (slower):    npm run dev:clean
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

function printSection(message) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${message}`);
  console.log('='.repeat(60));
}

function killProcessesOnPort(port) {
  console.log(`\n[1/3] Checking for processes on port ${port}...`);

  try {
    const isWindows = process.platform === 'win32';

    if (isWindows) {
      // Windows: Find and kill processes on port
      try {
        const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
        const pids = new Set();

        output.split('\n').forEach(line => {
          if (line.includes('LISTENING')) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && !isNaN(pid)) {
              pids.add(pid);
            }
          }
        });

        if (pids.size > 0) {
          pids.forEach(pid => {
            try {
              execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
              console.log(`   ✓ Killed process ${pid} on port ${port}`);
            } catch (e) {
              // Process might have already exited
            }
          });
        } else {
          console.log(`   ✓ No processes found on port ${port}`);
        }
      } catch (e) {
        console.log(`   ✓ No processes found on port ${port}`);
      }
    } else {
      // Linux/Mac: Use lsof
      try {
        const output = execSync(`lsof -ti:${port}`, { encoding: 'utf8' });
        const pids = output.trim().split('\n').filter(pid => pid);

        if (pids.length > 0) {
          pids.forEach(pid => {
            try {
              execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
              console.log(`   ✓ Killed process ${pid} on port ${port}`);
            } catch (e) {
              // Process might have already exited
            }
          });
        } else {
          console.log(`   ✓ No processes found on port ${port}`);
        }
      } catch (e) {
        console.log(`   ✓ No processes found on port ${port}`);
      }
    }
  } catch (error) {
    console.log(`   ⚠ Warning: Could not check port ${port}: ${error.message}`);
  }
}

function clearNextCache() {
  console.log('\n[2/3] Clearing Next.js cache...');

  const dirsToRemove = [
    path.join(process.cwd(), '.next'),
    path.join(process.cwd(), 'node_modules', '.cache'),
  ];

  let removedCount = 0;

  dirsToRemove.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        removedCount++;
      } catch (e) {
        // Ignore errors
      }
    }
  });

  if (removedCount > 0) {
    console.log(`   ✓ Removed ${removedCount} cache directories`);
  } else {
    console.log('   ✓ No cache to clear');
  }
}

function startNextDev() {
  console.log('\n[3/3] Starting Next.js development server...');
  console.log('\n   Server: http://localhost:3000');
  console.log('   Press Ctrl+C to stop\n');
  console.log('='.repeat(60) + '\n');

  // Start Next.js dev server
  const nextDev = spawn('next', ['dev'], {
    stdio: 'inherit',
    shell: true,
  });

  nextDev.on('error', (error) => {
    console.error('Failed to start Next.js:', error);
    process.exit(1);
  });

  nextDev.on('close', (code) => {
    if (code !== 0) {
      console.log(`\n✗ Next.js exited with code ${code}`);
    } else {
      console.log('\n✓ Server stopped gracefully');
    }
    process.exit(code);
  });

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n\nStopping server...');
    nextDev.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    nextDev.kill('SIGTERM');
  });
}

// Main execution
printSection('Gym Pilot Frontend - Startup');

killProcessesOnPort(PORT);
clearNextCache();
startNextDev();
