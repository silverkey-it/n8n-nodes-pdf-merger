import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

import {
	PDFDocument,
	PDFPage,
	PDFEmbeddedPage,
} from 'pdf-lib';

import filesize from 'filesize';

export class PdfMergerNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PDF Merger',
		name: 'pdfMergerNode',
		icon: 'fa:file-pdf',
		group: ['transform'],
		version: 1,
		description: 'Merge two PDF files by overlaying pages',
		defaults: {
			name: 'PDF Merger',
		},
		inputs: ['main'] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],
		properties: [
			{
				displayName: 'PDF File with House Style',
				name: 'binaryData1',
				type: 'string',
				default: 'binaryData1',
				description: 'Name of the binary property that contains the PDF with the house style',
			},
			{
				displayName: 'PDF File with Content',
				name: 'binaryData2',
				type: 'string',
				default: 'binaryData2',
				description: 'Name of the binary property that contains the PDF with the content',
			},
			{
				displayName: 'Output File Name',
				name: 'outputFileName',
				type: 'string',
				default: 'merged.pdf',
				description: 'Name of the output file',
			},
			{
				displayName: 'Output Binary Property',
				name: 'outputBinaryProperty',
				type: 'string',
				default: 'mergedPdf',
				description: 'Name of the binary property in which to store the merged PDF',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const pdfFileProp1 = this.getNodeParameter('binaryData1', i) as string;
			const pdfFileProp2 = this.getNodeParameter('binaryData2', i) as string;
			const outputFileName = this.getNodeParameter('outputFileName', i) as string;
			const outputBinaryPropertyName = this.getNodeParameter('outputBinaryProperty', i) as string;

			const item = items[i];

			if (!item.binary) {
				throw Error('No binary data found on item.');
			}

			const { bufferPdf1, bufferPdf2 } = PdfMergerNode.getPdfBuffers(item, pdfFileProp1, pdfFileProp2);
			const mergedPdfBytes = await PdfMergerNode.mergePdfBuffers(bufferPdf1, bufferPdf2);

			returnData.push({
				json: {},
				binary: {
					...item.binary,
					[outputBinaryPropertyName]: {
						data: Buffer.from(mergedPdfBytes).toString('base64'),
						mimeType: 'application/pdf',
						fileName: outputFileName,
						fileExtension: 'pdf',
						fileSize: filesize.filesize(mergedPdfBytes.length),
					},
				},
			});
		}

		return this.prepareOutputData(returnData);
	}

	static getPdfBuffers(
		item: INodeExecutionData,
		pdfFileProp1: string,
		pdfFileProp2: string,
	): { bufferPdf1: Buffer; bufferPdf2: Buffer } {
		const binaryData1 = item.binary?.[pdfFileProp1];
		const binaryData2 = item.binary?.[pdfFileProp2];

		if (!binaryData1 || !binaryData2) {
			throw Error(`Binary data properties "${pdfFileProp1}" or "${pdfFileProp2}" not found on item.`);
		}

		return {
			bufferPdf1: Buffer.from(binaryData1.data, binaryData1.data ? 'base64' : undefined),
			bufferPdf2: Buffer.from(binaryData2.data, binaryData2.data ? 'base64' : undefined),
		};
	}

	static async mergePdfBuffers(bufferPdf1: Buffer, bufferPdf2: Buffer): Promise<Uint8Array> {
		const pdfDoc1 = await PDFDocument.load(bufferPdf1);
		const pdfDoc2 = await PDFDocument.load(bufferPdf2);
		const mergedPdf = await PDFDocument.create();

		const doc1Pages = pdfDoc1.getPages();
		const doc2Pages = pdfDoc2.getPages();

		const houseStylePage = doc1Pages.length > 0 ? doc1Pages[0] : undefined;
		const embeddedHouseStylePage = houseStylePage
			? (await mergedPdf.embedPages([houseStylePage]))[0]
			: null;

		for (let pageIndex = 0; pageIndex < doc2Pages.length; pageIndex++) {
			const contentSource = doc2Pages[pageIndex];
			const embeddedContentPage = await PdfMergerNode.embedPageIfExists(mergedPdf, contentSource);

			const [width, height] = PdfMergerNode.determinePageSize(
				embeddedHouseStylePage,
				embeddedContentPage,
			);

			const mergedPage = mergedPdf.addPage([width, height]);

			if (embeddedHouseStylePage) {
				mergedPage.drawPage(embeddedHouseStylePage, { x: 0, y: 0 });
			}

			if (embeddedContentPage) {
				mergedPage.drawPage(embeddedContentPage, { x: 0, y: 0 });
			}
		}

		return mergedPdf.save();
	}

	static async embedPageIfExists(
		pdfDoc: PDFDocument,
		sourcePage?: PDFPage,
	): Promise<PDFEmbeddedPage | null> {
		if (!sourcePage) return null;
		const [embedded] = await pdfDoc.embedPages([sourcePage]);
		return embedded;
	}

	static determinePageSize(
		hStylePage?: PDFEmbeddedPage | null,
		contentPage?: PDFEmbeddedPage | null,
	): [number, number] {
		// Default ~ A4
		const defaultWidth = 595;
		const defaultHeight = 842;

		if (hStylePage) {
			return [hStylePage.width, hStylePage.height];
		}
		if (contentPage) {
			return [contentPage.width, contentPage.height];
		}
		return [defaultWidth, defaultHeight];
	}
}
