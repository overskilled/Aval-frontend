import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import QRCode from "qrcode";

/**
 * Print-ready PDF for a generated batch — rendered in the browser via
 * @react-pdf/renderer.
 *
 * Layout
 *   • A4, 2 × 4 grid of QR tiles per page (8 codes / page).
 *   • Header: institution + batch + SKU + dates.
 *   • Light ochre watermark of the batch code on the page background.
 *   • Footer: page X / Y, generation timestamp.
 *
 * Performance
 *   We pre-rasterise all QR codes to PNG data URLs *before* handing them to
 *   react-pdf — building one canvas per code is the heavy step but it's
 *   trivially batchable. Browsers handle ~5k codes comfortably; for larger
 *   batches the CSV path is recommended.
 */

// --- styles --------------------------------------------------------------
const ink = "#14181F";
const muted = "#6C6655";
const ochre = "#A85A2C";
const paper = "#FBF5E7";
const rule = "#C9BFA8";

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 28,
    backgroundColor: paper,
    fontFamily: "Helvetica",
    color: ink,
  },
  watermarkLayer: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.04,
  },
  watermarkText: {
    fontSize: 96,
    fontFamily: "Helvetica-Bold",
    color: ochre,
    transform: "rotate(-30deg)",
    letterSpacing: 6,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: rule,
    paddingBottom: 8,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  brand: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: ink,
  },
  brandMeta: {
    fontSize: 9,
    color: muted,
    marginTop: 3,
  },
  batchCode: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: ochre,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 6,
    fontSize: 8.5,
    color: muted,
  },
  metaItem: {
    flexDirection: "row",
    gap: 4,
  },
  metaKey: {
    fontFamily: "Helvetica-Bold",
    color: ink,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    flexGrow: 1,
  },
  tile: {
    width: "50%",
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tileFrame: {
    borderWidth: 0.5,
    borderColor: rule,
    padding: 14,
    alignItems: "center",
    width: "100%",
  },
  qrImage: {
    width: 170,
    height: 170,
  },
  caption: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
    textAlign: "center",
  },
  captionMeta: {
    fontSize: 7.5,
    color: muted,
    marginTop: 2,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 14,
    left: 28,
    right: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: muted,
  },
});

const TILES_PER_PAGE = 8;

// --- helpers -------------------------------------------------------------
function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

async function rasterizeQrCodes(codes) {
  // sequential rasterisation keeps memory bounded; toDataURL is ~5ms/code
  const out = new Array(codes.length);
  for (let i = 0; i < codes.length; i++) {
    out[i] = {
      ...codes[i],
      qr: await QRCode.toDataURL(codes[i].url, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 360,
      }),
    };
  }
  return out;
}

// --- document component --------------------------------------------------
export function BatchPdfDocument({ batch, sku, institution, codes, generatedAt }) {
  const pages = chunk(codes, TILES_PER_PAGE);
  const totalPages = Math.max(pages.length, 1);
  const generationStamp = generatedAt
    ? new Date(generatedAt).toLocaleString("fr-FR")
    : new Date().toLocaleString("fr-FR");

  return (
    <Document
      title={`Aval ${batch.code}`}
      author={`Aval — ${institution?.legalName ?? "—"}`}
      subject={`Print-ready codes for batch ${batch.code}`}
    >
      {pages.map((tiles, p) => (
        <Page key={p} size="A4" style={styles.page}>
          {/* watermark */}
          <View fixed style={styles.watermarkLayer}>
            <Text style={styles.watermarkText}>{batch.code}</Text>
          </View>

          {/* header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.brand}>Aval</Text>
                <Text style={styles.brandMeta}>
                  {institution?.legalName || "—"}
                </Text>
              </View>
              <Text style={styles.batchCode}>{batch.code}</Text>
            </View>
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaKey}>SKU :</Text>
                <Text>{sku?.name || "—"}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaKey}>Vol. :</Text>
                <Text>{sku?.declaredVolumeMl} mL</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaKey}>Production :</Text>
                <Text>{fmtDate(batch.productionDate)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaKey}>Expiration :</Text>
                <Text>{fmtDate(batch.expiryDate)}</Text>
              </View>
            </View>
          </View>

          {/* tile grid */}
          <View style={styles.grid}>
            {tiles.map((c) => (
              <View key={c.identifiant} style={styles.tile}>
                <View style={styles.tileFrame}>
                  <Image style={styles.qrImage} src={c.qr} />
                  <Text style={styles.caption}>{c.identifiant}</Text>
                  <Text style={styles.captionMeta}>scannez pour vérifier</Text>
                </View>
              </View>
            ))}
          </View>

          {/* footer */}
          <View fixed style={styles.footer}>
            <Text>Aval — sceau de confiance du consommateur</Text>
            <Text>
              Page {p + 1} / {totalPages}  ·  généré le {generationStamp}
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}

/**
 * Build a Blob of the print-ready PDF. Pre-rasterises QR codes from the URLs
 * in `codes` and renders the document via @react-pdf/renderer.
 */
export async function buildBatchPdfBlob({ batch, sku, institution, codes, generatedAt }) {
  const withQr = await rasterizeQrCodes(codes);
  const blob = await pdf(
    <BatchPdfDocument
      batch={batch}
      sku={sku}
      institution={institution}
      codes={withQr}
      generatedAt={generatedAt}
    />,
  ).toBlob();
  return blob;
}
