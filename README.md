![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

Hier is de volledige README in markdown-formaat:

# PDF Merger Node for n8n

A custom node to merge two PDF files in your n8n workflows. Overlay a house style PDF onto a content PDF, with fallback handling for differing page counts.

---

## 📖 Overview

The **PDF Merger Node** allows you to:
- Overlay a "house style" PDF onto a "content" PDF.
- Handle differences in page counts gracefully.
- Output a merged PDF file.

---

## 🛠️ Node Configuration

### Inputs
- **House Style PDF**: Binary property for the house style file (default: `binaryData1`).
- **Content PDF**: Binary property for the content file (default: `binaryData2`).

### Output
- **Merged PDF**: The combined PDF file as a binary property (`merged.pdf`).

---

## 🚀 Installation

### Step-by-Step Guide

1. Clone the repository:
	 ```bash 
	git clone https://github.com/silverkey-it/n8n-nodes-pdf-merger.git
	 ```
2.	Navigate to the directory:
		```bash 
		cd n8n-nodes-pdf-merger
		```
3.	Install dependencies and build the node:
		```bash 
		pnpm install && pnpm run build
		```
4.	Copy the build to your n8n custom nodes folder:
		```bash 
		cp -r dist/ ~/.n8n/custom/
		```
5.	Restart your n8n instance to load the new node:
		```bash 
		n8n stop && n8n start
		```
		or just start it:
		```bash 
		n8n start
		```
## Example Workflow
1.	Add two PDFs to your workflow:
•	One as content.
•	One as house style.
2.	Use the PDF Merger Node to merge them.
3.	Output the result as a new merged PDF.

## License

This project is licensed under the MIT License. Feel free to use, modify, and distribute as needed.

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

Happy merging! 🎉
