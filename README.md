# EDI Tools Suite

A comprehensive EDI (Electronic Data Interchange) toolkit built with Angular featuring both generation and visualization capabilities.

## 🚀 Live Demo

**[Try it now!](https://shubhamm99.github.io/edi-file-generator/)**

## Overview

This application provides a complete suite for working with EDI 835 (Healthcare Claim Payment/Advice) documents. Whether you need to generate new EDI files or parse and analyze existing ones, this tool has you covered.

## ✨ Features

### EDI Generator
- **Interactive Form Interface**: User-friendly form for creating EDI 835 files
- **Real-time Preview**: See your EDI document as you build it
- **Comprehensive Support**: Full support for all EDI 835 segments including:
  - Transaction settings (ISA, GS, ST, BPR, TRN)
  - Payer, Patient, and Provider information
  - Multiple claims with service lines
  - Claim adjustments (CAS segments)
  - Provider level adjustments (PLB segments)
- **Duplicate Functionality**: Easily duplicate claims, service lines, and adjustments
- **Reset Capability**: Clear and start fresh at any time
- **Compact & Accessible**: Clean, modern UI with full accessibility support

### EDI Visualizer
- **Smart Parsing**: Automatically detects delimiters and segment terminators
- **Payment Summary**: Quick overview of check amount, check number, check date
- **Claim Details**: View all claims with:
  - Claim numbers and ICN (Internal Control Number)
  - Claim status (Primary, Secondary, Denied, etc.)
  - Charged, paid, and patient responsibility amounts
  - Service dates
  - Adjustments with group codes and reason codes
  - Remark codes
- **Service Line Breakdown**: Detailed procedure codes and amounts
- **Provider Adjustments (PLB)**: View provider-level adjustments separately
- **Raw Segment View**: Toggle detailed segment-by-segment breakdown
- **Sample Data**: Load sample EDI for testing and learning

## 🛠️ Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Angular CLI (v18+)

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/shubhamm99/edi-file-generator.git

# Navigate to project directory
cd edi-file-generator

# Install dependencies
npm install
```

## 💻 Development

```bash
# Start development server
npm start
# or
ng serve

# Navigate to http://localhost:4200
```

## 🏗️ Build

```bash
# Build for production
npm run build
# or
ng build

# Output will be in dist/ directory
```

## 📖 Usage

### EDI Generator

1. Click on the **EDI Generator** tab
2. Fill in transaction settings, payer, patient, and provider information
3. Add claims with service lines
4. Add adjustments (CAS) and provider-level adjustments (PLB) as needed
5. Preview the generated EDI in real-time
6. Copy the EDI content to clipboard or save it

### EDI Visualizer

1. Click on the **EDI Visualizer** tab
2. Paste your EDI 835 content or click "Load Sample"
3. Click "Visualize EDI" to parse and analyze
4. Review the payment summary, claims, adjustments, and remark codes
5. Optionally toggle "Show Raw Segments" for detailed segment breakdown

## 🎨 Key Features

- **Collapsible Sections**: Expand/collapse sections for better focus
- **Keyboard Navigation**: Full keyboard accessibility
- **Tooltips**: Helpful tooltips on all action buttons
- **Responsive Design**: Works on desktop and tablet devices
- **Copy to Clipboard**: Easy copying of generated EDI content
- **Clean UI**: Modern, compact interface using Tailwind CSS

## 🔧 Technologies

- **Angular 18**: Standalone components with signals
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Reactive Forms**: Dynamic form management with FormBuilder and FormArray
- **ARIA**: Full accessibility support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 📧 Contact

For questions or support, please open an issue in the [GitHub repository](https://github.com/shubhamm99/edi-file-generator/issues).

## 🙏 Acknowledgments

- EDI 835 specification from ASC X12
- Healthcare EDI standards and guidelines

---

**[View Live Demo](https://shubhamm99.github.io/edi-file-generator/)** | **[Report Bug](https://github.com/shubhamm99/edi-file-generator/issues)** | **[Request Feature](https://github.com/shubhamm99/edi-file-generator/issues)**