/**
 * TypeScript Type Definitions for Token Exporter Plugin
 * Generated from analysis of src/code.js data structures
 * 
 * These types provide IntelliSense and type checking for the Figma plugin
 * without requiring a full TypeScript compilation step.
 */

// ========== CORE FIGMA API TYPES ==========

declare global {
  const figma: PluginAPI;
}

// ========== CONFIGURATION CONSTANTS ==========

interface PluginConfig {
  readonly BATCH_SIZE: 100;
  readonly CHUNK_SIZE: 10;
  readonly MEMORY_WARNING_THRESHOLD: 100;
  readonly MAX_EXPORT_SIZE: number;
  readonly MAX_ALIAS_DEPTH: 100;
  readonly VALID_FORMATS: readonly string[];
  readonly UNITLESS_SCOPES: readonly string[];
}

// ========== CUSTOM ERROR TYPES ==========

interface CustomErrorContext {
  [key: string]: any;
  timestamp?: string;
}

interface ValidationError extends Error {
  name: 'ValidationError';
  context: CustomErrorContext;
  timestamp: string;
}

interface NetworkError extends Error {
  name: 'NetworkError';
  context: CustomErrorContext;
  timestamp: string;
}

interface ProcessingError extends Error {
  name: 'ProcessingError';
  context: CustomErrorContext;
  timestamp: string;
}

interface MemoryError extends Error {
  name: 'MemoryError';
  context: CustomErrorContext;
  timestamp: string;
}

// ========== TOKEN COUNTING TYPES ==========

interface TokenCounts {
  color: number;
  text: number;
  states: number;
  number: number;
}

interface GlobalTokenCounts extends TokenCounts {}

// ========== MEMORY MONITORING TYPES ==========

interface MemoryInfo {
  used: number;
  total: number;
  limit: number;
  usagePercent?: number;
}

// ========== ERROR HANDLING TYPES ==========

interface StructuredError {
  operation: string;
  message: string;
  stack?: string;
  context: Record<string, any>;
  timestamp: string;
}

// ========== NAMING CONVENTION TYPES ==========

interface NamingVariants {
  snake: string;
  kebab: string;
  camel: string;
}

// ========== VARIABLE RESOLUTION TYPES ==========

interface VariableResolutionContext {
  variableName?: string;
  modeId: string;
  visitedCount: number;
}

// ========== COLLECTION PROCESSING TYPES ==========

interface CollectionResult {
  id: string;
  name: string;
  counts: TokenCounts;
  totalVariables: number;
  error?: boolean;
}

interface CollectionMap extends Map<string, Variable[]> {}
interface VariableByIdMap extends Map<string, Variable> {}

// ========== EXPORT PROCESSING TYPES ==========

interface ExportInputs {
  collectionIds: string[];
  formats: string[];
  activeTokenTypes: string[];
}

// ========== TOKEN PROCESSING TYPES ==========

interface TokenData {
  value: string | number | boolean;
  type: 'color' | 'string' | 'boolean' | 'dimension' | 'number';
  raw: any;
}

interface ProcessedToken {
  path: string[];
  tokenData: TokenData;
}

interface DesignTokens {
  [key: string]: TokenData | DesignTokens;
}

// ========== COLOR VALUE TYPES ==========

interface RGBAColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

// ========== FORMAT GENERATION TYPES ==========

interface ExportFile {
  filename: string;
  content: string;
}

interface FormatGenerationContext {
  format: string;
  hasDesignTokens: boolean;
  tokenCount: number;
}

// ========== STYLE DICTIONARY INTEGRATION ==========

interface ColorTransforms {
  hexToIosRgb(hexValue: string): { red: number; green: number; blue: number; alpha: number };
}

interface FormatGenerators {
  css(tokens: Record<string, any>): string;
  swift?(tokens: Record<string, any>): string;
  android?(tokens: Record<string, any>): string;
  flutter?(tokens: Record<string, any>): string;
  w3c?(tokens: Record<string, any>): string;
  tailwind?(tokens: Record<string, any>): string;
  typescript?(tokens: Record<string, any>): string;
}

interface StyleTransforms {
  colorTransforms: ColorTransforms;
  formatGenerators: FormatGenerators;
  error?: boolean;
  message?: string;
}

declare global {
  interface Window {
    styleTransforms?: StyleTransforms;
  }
}

// ========== MESSAGE HANDLING TYPES ==========

interface UIMessage {
  type: 'get-collections' | 'export-tokens' | 'resize' | 'open-url' | 'notify';
}

interface ExportMessage extends UIMessage {
  type: 'export-tokens';
  collectionIds: string[];
  formats: string[];
  activeTokenTypes: string[];
}

interface ResizeMessage extends UIMessage {
  type: 'resize';
  width: number;
  height: number;
}

interface OpenUrlMessage extends UIMessage {
  type: 'open-url';
  url: string;
}

interface NotifyMessage extends UIMessage {
  type: 'notify';
  message: string;
  error?: boolean;
}

interface ProgressMessage {
  type: 'export-progress';
  percent: number;
}

interface ResultMessage {
  type: 'export-result';
  data: ExportFile[];
}

interface CollectionsMessage {
  type: 'all-collections';
  collections: CollectionResult[];
  globalCounts?: GlobalTokenCounts;
}

// ========== URL VALIDATION TYPES ==========

interface URLValidationContext {
  received: string;
  originalError?: string;
  protocol?: string;
  allowed?: string[];
}

// ========== PLATFORM-SPECIFIC TYPES ==========

type Platform = 'css' | 'swift' | 'android' | 'flutter' | 'w3c' | 'tailwind';

interface PlatformTransformation {
  (name: string): string;
}

interface PlatformTransformations {
  css: PlatformTransformation;
  tailwind: PlatformTransformation;
  w3c: PlatformTransformation;
  swift: PlatformTransformation;
  flutter: PlatformTransformation;
  android: PlatformTransformation;
}

// ========== TAILWIND CONFIG TYPES ==========

interface TailwindTheme {
  colors?: Record<string, string>;
  spacing?: Record<string, string>;
  borderRadius?: Record<string, string>;
  fontSize?: Record<string, string>;
  fontWeight?: Record<string, string>;
  lineHeight?: Record<string, string>;
}

interface TailwindConfig {
  theme: {
    extend: TailwindTheme;
  };
}

// ========== TYPESCRIPT GENERATION TYPES ==========

interface TypeScriptStructure {
  interfaceProps: string[];
  tokenValues: string[];
}

interface TypeScriptExport {
  interface: string;
  constants: string;
}

// ========== W3C TOKEN TYPES ==========

interface W3CToken {
  $type: string;
  $value: any;
}

interface W3CTokens {
  token: Record<string, W3CToken | W3CTokens>;
}

// ========== UTILITY FUNCTION TYPES ==========

declare function validateExportInputs(
  collectionIds: string[], 
  formats: string[], 
  activeTokenTypes: string[]
): void;

declare function checkMemoryUsage(throwOnExceed?: boolean): MemoryInfo | null;

declare function createStructuredError(
  operation: string, 
  error: Error, 
  context?: Record<string, any>
): StructuredError;

declare function generateNamingVariants(path: string[]): NamingVariants;

declare function resolveVariableValue(
  variable: Variable,
  modeId: string, 
  variablesById: VariableByIdMap,
  visited?: Set<string>
): Promise<any>;

declare function sanitizeName(name: string, platform?: Platform): string;

declare function processCollectionsSequentially(
  collections: VariableCollection[],
  variablesByCollection: CollectionMap
): Promise<CollectionResult[]>;

declare function getCollectionsForUI(): Promise<void>;

declare function generateExportData(
  collectionIds: string[],
  formats: string[],
  activeTokenTypes: string[]
): Promise<ExportFile[]>;

declare function flattenTokens(obj: DesignTokens, prefix?: string): Record<string, string>;

declare function generateFormatContent(
  designTokens: DesignTokens,
  format: string
): ExportFile | null;

declare function generateFormatContentManual(
  designTokens: DesignTokens,
  format: string
): ExportFile | null;

// ========== GLOBAL VARIABLES ==========

declare let globalTokenCounts: GlobalTokenCounts;