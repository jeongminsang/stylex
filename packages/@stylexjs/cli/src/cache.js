/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs/promises';
import path from 'path';
import hash from './hash';

// Default cache directory in `node_modules/.stylex-cache`
export function getDefaultCachePath() {
  return path.join('node_modules', '.stylex-cache');
}

const PROJECT_INDICATORS = ['package.json', 'deno.json', 'deno.jsonc', '.git'];

export async function findProjectRoot(startPath = process.cwd()) {
  let currentDir = path.resolve(startPath);
  const rootDir = path.parse(currentDir).root;

  while (currentDir !== rootDir) {
    for (const indicator of PROJECT_INDICATORS) {
      try {
        const filePath = path.join(currentDir, indicator);
        await fs.access(filePath);
        return currentDir;
      } catch {}
    }

    currentDir = path.dirname(currentDir);
  }

  throw new Error(
    `Project root not found. None of the following indicators were found: ${PROJECT_INDICATORS.join(
      ', ',
    )}`,
  );
}

async function findNearestBabelRC(dir) {
  let currentDir = dir;

  while (currentDir !== path.parse(currentDir).root) {
    const babelrcPath = path.join(currentDir, '.babelrc');
    try {
      await fs.access(babelrcPath);
      console.log('Found babelrc:', babelrcPath);
      return babelrcPath;
    } catch {
      currentDir = path.dirname(currentDir);
    }
  }
  console.log('Found no babelrc:');
  return null;
}

export async function getCacheFilePath(cachePath, filePath) {
  const projectRoot = await findProjectRoot(filePath);
  const absoluteFilePath = path.resolve(filePath);
  const relativePath = path.relative(projectRoot, absoluteFilePath);
  const fileName = relativePath.replace(/[\\/]/g, '__');
  return path.join(cachePath, `${fileName}.json`);
}

export async function readCache(cachePath, filePath) {
  const cacheFile = await getCacheFilePath(cachePath, filePath);
  try {
    const cacheData = await fs.readFile(cacheFile, 'utf-8');
    return JSON.parse(cacheData);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File does not exist
      return null;
    }
    throw error;
  }
}

export async function writeCache(cachePath, filePath, data) {
  const cacheFile = await getCacheFilePath(cachePath, filePath);
  const dirPath = path.dirname(cacheFile);

  await fs.mkdir(dirPath, { recursive: true });
  console.log('Writing cache to:', cacheFile);
  await fs.writeFile(cacheFile, JSON.stringify(data), 'utf-8');
}

export async function deleteCache(cachePath, filePath) {
  const cacheFile = await getCacheFilePath(cachePath, filePath);
  try {
    await fs.unlink(cacheFile);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      // Rethrow errors other than file not existing
      throw error;
    }
  }
}

export async function computeBabelRCHash(path) {
  const babelPath = await findNearestBabelRC(path);
  if (!babelPath) {
    return null; // No .babelrc found
  }

  try {
    const fileBuffer = await fs.readFile(babelPath);
    const fileContent = fileBuffer.toString('utf8');
    return hash(fileContent);
  } catch (error) {
    console.error(`Error reading or hashing file: ${error.message}`);
    throw error;
  }
}

export function computeStyleXConfigHash(config) {
  // Excluding `input` and `output` paths to hash config settings
  const configOptions = Object.fromEntries(
    Object.entries(config).filter(
      ([key]) => key !== 'input' && key !== 'output',
    ),
  );

  const jsonRepresentation = JSON.stringify(
    configOptions,
    Object.keys(configOptions).sort(),
  );

  return hash(jsonRepresentation);
}

export async function computeFilePathHash(filePath) {
  const absoluteFilePath = path.resolve(filePath);
  const parsedFile = path.parse(absoluteFilePath);

  await fs.mkdir(parsedFile.dir, { recursive: true });

  const possibleExtensions = ['.ts', '.js'];
  let newPath = absoluteFilePath;

  let fileExists = false;

  try {
    fileExists = await fs
      .access(newPath)
      .then(() => true)
      .catch(() => false);
  } catch {
    fileExists = false;
  }

  if (!fileExists) {
    for (const ext of possibleExtensions) {
      const tempPath = path.join(parsedFile.dir, `${parsedFile.name}${ext}`);
      fileExists = await fs
        .access(tempPath)
        .then(() => true)
        .catch(() => false);
      if (fileExists) {
        newPath = tempPath;
        break;
      }
    }
  }

  if (!fileExists) {
    throw new Error(`Error generating hash: file not found: ${newPath}`);
  }

  const content = await fs.readFile(newPath, 'utf-8');
  return hash(content);
}
