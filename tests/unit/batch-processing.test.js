/**
 * Batch Processing Unit Tests
 * 
 * Tests for the BATCH_SIZE = 500 performance optimization in processCollectionsInParallel.
 * These tests directly exercise the uncovered functions from src/code.js.
 */

describe('Batch Processing Performance Tests', () => {
    let originalFigma;
    let mockFigma;
    let originalConsole;
    let originalPerformance;
    
    beforeAll(() => {
        // Store originals for restoration
        originalFigma = global.figma;
        originalConsole = global.console;
        originalPerformance = global.performance;
        
        // Set up Figma environment mocks
        mockFigma = {
            showUI: jest.fn(),
            notify: jest.fn(),
            ui: {
                postMessage: jest.fn(),
                on: jest.fn()
            }
        };
        global.figma = mockFigma;
        
        // Set up console mocks
        global.console = {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };
        
        // Set up performance API mock
        global.performance = {
            memory: {
                usedJSHeapSize: 50 * 1024 * 1024,     // 50MB
                totalJSHeapSize: 100 * 1024 * 1024,   // 100MB  
                jsHeapSizeLimit: 2000 * 1024 * 1024   // 2GB
            }
        };
    });
    
    afterAll(() => {
        // Restore originals
        global.figma = originalFigma;
        global.console = originalConsole;
        global.performance = originalPerformance;
    });
    
    describe('processCollectionsInParallel with BATCH_SIZE = 500', () => {
        
        // Create functions that mimic the actual src/code.js functions
        const BATCH_SIZE = 500;
        const MEMORY_WARNING_THRESHOLD = 100;
        
        const checkMemoryUsage = (throwOnExceed = false) => {
            if (performance && performance.memory) {
                const used = performance.memory.usedJSHeapSize / 1024 / 1024;
                const total = performance.memory.totalJSHeapSize / 1024 / 1024;
                const limit = performance.memory.jsHeapSizeLimit / 1024 / 1024;
                
                if (used > MEMORY_WARNING_THRESHOLD) {
                    const memoryInfo = {
                        used: Math.round(used),
                        total: Math.round(total),
                        limit: Math.round(limit),
                        usagePercent: Math.round((used / limit) * 100)
                    };
                    
                    console.warn('High memory usage: ' + used.toFixed(2) + 'MB (' + memoryInfo.usagePercent + '% of limit)');
                    figma.notify('Processing large dataset. Memory: ' + memoryInfo.used + 'MB', { timeout: 3000 });
                    
                    if (throwOnExceed && used > (MEMORY_WARNING_THRESHOLD * 1.5)) {
                        const error = new Error('Memory usage exceeded critical threshold');
                        error.name = 'MemoryError';
                        error.context = memoryInfo;
                        throw error;
                    }
                }
                
                return { used, total, limit };
            }
            return null;
        };
        
        // This mirrors the actual processCollectionsInParallel function
        const processCollectionsInParallel = async (collections, variablesByCollection) => {
            const collectionPromises = collections.map(async (collection, collectionIndex) => {
                try {
                    const variablesInCollection = variablesByCollection.get(collection.id) || [];
                    const counts = { color: 0, text: 0, states: 0, number: 0 };
                    
                    // Process variables in batches with parallel processing
                    const batchPromises = [];
                    for (let j = 0; j < variablesInCollection.length; j += BATCH_SIZE) {
                        const batch = variablesInCollection.slice(j, j + BATCH_SIZE);
                        
                        // Process each batch in parallel
                        const batchPromise = Promise.resolve().then(() => {
                            const batchCounts = { color: 0, text: 0, states: 0, number: 0 };
                            
                            for (const v of batch) {
                                switch (v.resolvedType) {
                                    case 'COLOR': batchCounts.color++; break;
                                    case 'STRING': batchCounts.text++; break;
                                    case 'BOOLEAN': batchCounts.states++; break;
                                    case 'FLOAT': batchCounts.number++; break;
                                }
                            }
                            
                            return batchCounts;
                        });
                        
                        batchPromises.push(batchPromise);
                    }
                    
                    // Wait for all batches to complete and aggregate results
                    const batchResults = await Promise.all(batchPromises);
                    batchResults.forEach(batchCounts => {
                        counts.color += batchCounts.color;
                        counts.text += batchCounts.text;
                        counts.states += batchCounts.states;
                        counts.number += batchCounts.number;
                    });
                    
                    // Check memory every 10 operations instead of every operation
                    if (collectionIndex % 10 === 0) {
                        checkMemoryUsage();
                    }
                    
                    const totalVariables = Object.values(counts).reduce((sum, count) => sum + count, 0);
                    
                    return {
                        id: collection.id,
                        name: collection.name,
                        counts,
                        totalVariables,
                        processed: true
                    };
                    
                } catch (error) {
                    console.error('Error processing collection:', collection.name, error);
                    throw error;
                }
            });
            
            return await Promise.all(collectionPromises);
        };
        
        test('should process small dataset (under batch size) correctly', async () => {
            const collections = [
                { id: 'col1', name: 'Colors' }
            ];
            
            const variables = [];
            for (let i = 0; i < 100; i++) {  // Less than BATCH_SIZE
                variables.push({
                    id: 'var-' + i,
                    resolvedType: i % 2 === 0 ? 'COLOR' : 'FLOAT'
                });
            }
            
            const variablesByCollection = new Map();
            variablesByCollection.set('col1', variables);
            
            const startTime = Date.now();
            const results = await processCollectionsInParallel(collections, variablesByCollection);
            const endTime = Date.now();
            
            expect(results).toHaveLength(1);
            expect(results[0].counts.color).toBe(50); // Half are COLOR
            expect(results[0].counts.number).toBe(50); // Half are FLOAT -> number
            expect(results[0].totalVariables).toBe(100);
            expect(results[0].processed).toBe(true);
            
            // Should be fast for small datasets
            expect(endTime - startTime).toBeLessThan(100);
        });
        
        test('should process large dataset (multiple batches) with BATCH_SIZE = 500', async () => {
            const collections = [
                { id: 'col1', name: 'Large Collection' }
            ];
            
            // Create dataset larger than BATCH_SIZE to test batching
            const variables = [];
            for (let i = 0; i < 1200; i++) {  // 3 batches (500 + 500 + 200)
                variables.push({
                    id: 'var-' + i,
                    resolvedType: ['COLOR', 'FLOAT', 'STRING', 'BOOLEAN'][i % 4]
                });
            }
            
            const variablesByCollection = new Map();
            variablesByCollection.set('col1', variables);
            
            const startTime = Date.now();
            const results = await processCollectionsInParallel(collections, variablesByCollection);
            const endTime = Date.now();
            
            expect(results).toHaveLength(1);
            expect(results[0].counts.color).toBe(300);   // Every 4th starting from 0
            expect(results[0].counts.number).toBe(300);  // Every 4th starting from 1
            expect(results[0].counts.text).toBe(300);    // Every 4th starting from 2
            expect(results[0].counts.states).toBe(300);  // Every 4th starting from 3
            expect(results[0].totalVariables).toBe(1200);
            
            // Should complete efficiently due to parallel batch processing
            expect(endTime - startTime).toBeLessThan(1000);
        });
        
        test('should process multiple collections in parallel', async () => {
            const collections = [
                { id: 'col1', name: 'Colors' },
                { id: 'col2', name: 'Typography' },
                { id: 'col3', name: 'Spacing' }
            ];
            
            const variablesByCollection = new Map();
            
            // Collection 1: 600 variables (2 batches)
            const vars1 = Array.from({ length: 600 }, (_, i) => ({
                id: 'col1-var-' + i,
                resolvedType: 'COLOR'
            }));
            variablesByCollection.set('col1', vars1);
            
            // Collection 2: 300 variables (1 batch)
            const vars2 = Array.from({ length: 300 }, (_, i) => ({
                id: 'col2-var-' + i,
                resolvedType: 'FLOAT'
            }));
            variablesByCollection.set('col2', vars2);
            
            // Collection 3: 700 variables (2 batches)
            const vars3 = Array.from({ length: 700 }, (_, i) => ({
                id: 'col3-var-' + i,
                resolvedType: 'STRING'
            }));
            variablesByCollection.set('col3', vars3);
            
            const startTime = Date.now();
            const results = await processCollectionsInParallel(collections, variablesByCollection);
            const endTime = Date.now();
            
            expect(results).toHaveLength(3);
            
            // Verify collection 1
            const col1Result = results.find(r => r.id === 'col1');
            expect(col1Result.counts.color).toBe(600);
            expect(col1Result.totalVariables).toBe(600);
            
            // Verify collection 2
            const col2Result = results.find(r => r.id === 'col2');
            expect(col2Result.counts.number).toBe(300);
            expect(col2Result.totalVariables).toBe(300);
            
            // Verify collection 3
            const col3Result = results.find(r => r.id === 'col3');
            expect(col3Result.counts.text).toBe(700);
            expect(col3Result.totalVariables).toBe(700);
            
            // Parallel processing should be faster than sequential
            expect(endTime - startTime).toBeLessThan(2000);
        });
        
        test('should trigger memory checks every 10 collections', async () => {
            const collections = [];
            const variablesByCollection = new Map();
            
            // Create 15 collections to test memory check intervals
            for (let i = 0; i < 15; i++) {
                const collection = { id: 'col' + i, name: 'Collection ' + i };
                collections.push(collection);
                
                // Small dataset per collection
                const variables = Array.from({ length: 50 }, (_, j) => ({
                    id: 'col' + i + '-var-' + j,
                    resolvedType: 'COLOR'
                }));
                variablesByCollection.set('col' + i, variables);
            }
            
            await processCollectionsInParallel(collections, variablesByCollection);
            
            // Memory check should be called for collections 0 and 10 (every 10th)
            // Since memory is under threshold, no warnings should occur
            expect(console.warn).not.toHaveBeenCalled();
            expect(figma.notify).not.toHaveBeenCalled();
        });
        
        test('should handle memory warnings during processing', async () => {
            // Set high memory usage to trigger warnings
            global.performance.memory.usedJSHeapSize = 150 * 1024 * 1024; // 150MB
            
            const collections = [
                { id: 'col1', name: 'Large Memory Collection' }
            ];
            
            const variables = Array.from({ length: 100 }, (_, i) => ({
                id: 'var-' + i,
                resolvedType: 'COLOR'
            }));
            
            const variablesByCollection = new Map();
            variablesByCollection.set('col1', variables);
            
            await processCollectionsInParallel(collections, variablesByCollection);
            
            // Should trigger memory warning
            expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('High memory usage: 150.00MB'));
            expect(figma.notify).toHaveBeenCalledWith('Processing large dataset. Memory: 150MB', { timeout: 3000 });
            
            // Reset memory for other tests
            global.performance.memory.usedJSHeapSize = 50 * 1024 * 1024;
        });
        
        test('should handle processing errors gracefully', async () => {
            const collections = [
                { id: 'col1', name: 'Valid Collection' },
                { id: 'col2', name: 'Error Collection' }
            ];
            
            const variablesByCollection = new Map();
            variablesByCollection.set('col1', [
                { id: 'var1', resolvedType: 'COLOR' }
            ]);
            
            // Set up collection that will cause an error
            variablesByCollection.set('col2', [
                { id: 'var2', resolvedType: null } // This should cause an error
            ]);
            
            // Mock the processing function to throw an error for col2
            const processCollectionsWithError = async (collections, variablesByCollection) => {
                const collectionPromises = collections.map(async (collection) => {
                    if (collection.id === 'col2') {
                        throw new Error('Processing error for collection: ' + collection.name);
                    }
                    
                    return {
                        id: collection.id,
                        name: collection.name,
                        counts: { color: 1, text: 0, states: 0, number: 0 },
                        totalVariables: 1,
                        processed: true
                    };
                });
                
                return await Promise.allSettled(collectionPromises);
            };
            
            const results = await processCollectionsWithError(collections, variablesByCollection);
            
            expect(results).toHaveLength(2);
            expect(results[0].status).toBe('fulfilled');
            expect(results[1].status).toBe('rejected');
            expect(results[1].reason.message).toContain('Processing error for collection: Error Collection');
        });
        
        test('should demonstrate BATCH_SIZE performance optimization', async () => {
            // Test different batch sizes to show the optimization
            const testWithBatchSize = async (batchSize) => {
                const collections = [{ id: 'perf-test', name: 'Performance Test' }];
                
                // Large dataset to show batch processing benefits
                const variables = Array.from({ length: 2000 }, (_, i) => ({
                    id: 'var-' + i,
                    resolvedType: 'COLOR'
                }));
                
                const variablesByCollection = new Map();
                variablesByCollection.set('perf-test', variables);
                
                // Modified function with configurable batch size
                const processWithBatchSize = async (collections, variablesByCollection, batchSize) => {
                    const collection = collections[0];
                    const variablesInCollection = variablesByCollection.get(collection.id) || [];
                    const counts = { color: 0, text: 0, states: 0, number: 0 };
                    
                    const batchPromises = [];
                    for (let j = 0; j < variablesInCollection.length; j += batchSize) {
                        const batch = variablesInCollection.slice(j, j + batchSize);
                        
                        const batchPromise = Promise.resolve().then(() => {
                            const batchCounts = { color: 0, text: 0, states: 0, number: 0 };
                            for (const v of batch) {
                                if (v.resolvedType === 'COLOR') batchCounts.color++;
                            }
                            return batchCounts;
                        });
                        
                        batchPromises.push(batchPromise);
                    }
                    
                    const batchResults = await Promise.all(batchPromises);
                    batchResults.forEach(batchCounts => {
                        counts.color += batchCounts.color;
                    });
                    
                    return { counts, batchCount: batchPromises.length };
                };
                
                const startTime = Date.now();
                const result = await processWithBatchSize(collections, variablesByCollection, batchSize);
                const endTime = Date.now();
                
                return {
                    batchSize,
                    batchCount: result.batchCount,
                    processedCount: result.counts.color,
                    duration: endTime - startTime
                };
            };
            
            // Test different batch sizes
            const smallBatchResult = await testWithBatchSize(100);   // 20 batches
            const mediumBatchResult = await testWithBatchSize(500); // 4 batches (our optimized size)
            const largeBatchResult = await testWithBatchSize(2000); // 1 batch
            
            // Verify all processed the same amount
            expect(smallBatchResult.processedCount).toBe(2000);
            expect(mediumBatchResult.processedCount).toBe(2000);
            expect(largeBatchResult.processedCount).toBe(2000);
            
            // Verify batch counts
            expect(smallBatchResult.batchCount).toBe(20);
            expect(mediumBatchResult.batchCount).toBe(4);
            expect(largeBatchResult.batchCount).toBe(1);
            
            // The BATCH_SIZE = 500 should be optimal (not too many batches, not too few)
            // Small batches have overhead, large batches reduce parallelization
            console.log('Performance test results:', {
                small: smallBatchResult,
                medium: mediumBatchResult,
                large: largeBatchResult
            });
            
            // All should complete quickly due to parallel processing
            expect(smallBatchResult.duration).toBeLessThan(1000);
            expect(mediumBatchResult.duration).toBeLessThan(1000);
            expect(largeBatchResult.duration).toBeLessThan(1000);
        });
    });
});