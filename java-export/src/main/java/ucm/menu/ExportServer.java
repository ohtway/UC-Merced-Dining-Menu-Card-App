package ucm.menu;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.pdmodel.PDPageContentStream;

import java.awt.Color;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

public class ExportServer {

  private static final boolean DRAW_CARD_OUTLINE = false; // keep off

  // inches -> points
  private static float in2pt(double in){ return (float)(in * 72.0); }

  private static final float PAGE_W = in2pt(8.5);
  private static final float PAGE_H = in2pt(11);

  // layout
  private static final float CARD_W_IN = 3.57f;
  private static final float CARD_H_IN = 2.00f;
  private static final float START_X_IN = 0.68f;
  private static final float START_Y_IN = 0.44f;
  private static final float GROUP_W_IN = 7.15f;
  private static final float GROUP_H_IN = 10.02f;
  private static final int COLS = 2, ROWS = 5;

  private static final float GAP_X_IN = (GROUP_W_IN - COLS*CARD_W_IN) / (COLS - 1);
  private static final float GAP_Y_IN = (GROUP_H_IN - ROWS*CARD_H_IN) / (ROWS - 1);

  private static final float NAME_SIZE = 27.9f;
  private static final float LINE_SIZE = 16f;
  private static final float LINE_GAP  = 6f;

  private static final float CARD_PAD_X = in2pt(0.22); // left/right padding to constrain text
  private static final float CARD_PAD_Y = in2pt(0.18);

  private static final Color COL_BLACK  = new Color(0f, 0f, 0f);
  private static final Color COL_RED    = new Color(0.761f, 0.106f, 0.106f);
  private static final Color COL_GRAY   = new Color(0.4f, 0.4f, 0.4f);
  private static final Color COL_BORDER = new Color(0.055f, 0.133f, 0.247f);

  private static final Map<String,String> LABEL = Map.ofEntries(
    Map.entry("egg","Egg"), Map.entry("milk","Milk"), Map.entry("wheat","Wheat"),
    Map.entry("fish","Fish"), Map.entry("shellfish","Shellfish"), Map.entry("soy","Soy"),
    Map.entry("sesame","Sesame"), Map.entry("peanuts","Peanuts"),
    Map.entry("tree_nuts","Tree Nuts"), Map.entry("cc_all","May contain all allergens"),
    Map.entry("halal","Halal"), Map.entry("vegan","Vegan"), Map.entry("caffeine","Caffeine"),
    Map.entry("red40","Red 40"), Map.entry("yellow5","Yellow 5"),
    Map.entry("blue1","Blue 1"), Map.entry("blue2","Blue 2"), Map.entry("green3","Green 3"),
    Map.entry("carrageenan","Carrageenan"), Map.entry("xanthan","Xanthan gum"),
    Map.entry("cellulose","Cellulose gum"), Map.entry("polysorbates","Polysorbates")
  );

  public static void main(String[] args) throws Exception {
    File base = args.length > 0 ? new File(args[0]) : new File("../menu-card-web");

    int port = 8080;
    HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
    server.createContext("/export", new ExportHandler(base));
    server.setExecutor(null);
    System.out.println("Export server on http://localhost:" + port + "/export");
    System.out.println("Assets base: " + base.getAbsolutePath());
    server.start();
  }

  static class ExportHandler implements HttpHandler {
    private final File baseDir;
    private final ObjectMapper mapper = new ObjectMapper();

    ExportHandler(File baseDir){ this.baseDir = baseDir; }

    @Override public void handle(HttpExchange ex) throws IOException {
      if ("OPTIONS".equalsIgnoreCase(ex.getRequestMethod())) {
        sendCORS(ex, 204, new byte[0]); return;
      }
      if (!"POST".equalsIgnoreCase(ex.getRequestMethod())) {
        sendCORS(ex, 405, "Method Not Allowed".getBytes(StandardCharsets.UTF_8)); return;
      }

      byte[] bodyBytes = ex.getRequestBody().readAllBytes();
      try {
        JsonNode root = mapper.readTree(bodyBytes);
        List<Card> cards;
        if (root.isArray()) {
          cards = mapper.convertValue(root, new TypeReference<List<Card>>() {});
        } else if (root.has("cards")) {
          cards = mapper.convertValue(root.get("cards"), new TypeReference<List<Card>>() {});
        } else {
          throw new IllegalArgumentException("Body must be JSON array of cards or {\"cards\": [...]}");
        }

        byte[] pdf = buildPdf(cards);
        ex.getResponseHeaders().set("Content-Type","application/pdf");
        ex.getResponseHeaders().set("Content-Disposition","attachment; filename=\"menu-cards.pdf\"");
        sendCORS(ex, 200, pdf);
      } catch (Exception e) {
        e.printStackTrace();
        byte[] err = ("Export failed: " + e.getMessage()).getBytes(StandardCharsets.UTF_8);
        sendCORS(ex, 500, err);
      }
    }

    private void sendCORS(HttpExchange ex, int status, byte[] data) throws IOException {
      ex.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
      ex.getResponseHeaders().set("Access-Control-Allow-Methods", "POST, OPTIONS");
      ex.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
      ex.sendResponseHeaders(status, data.length);
      try (OutputStream os = ex.getResponseBody()) { os.write(data); }
    }

    private byte[] buildPdf(List<Card> cards) throws IOException {
      File fonts = new File(baseDir, "assets/fonts");
      File icons = new File(baseDir, "assets/icons");

      try (PDDocument doc = new PDDocument()) {
        PDType0Font fontName  = PDType0Font.load(doc, new File(fonts, "calibrib.ttf"));
        PDType0Font fontBebas = PDType0Font.load(doc, new File(fonts, "BebasNeue-Regular.ttf"));

        PDImageXObject imgHalal = PDImageXObject.createFromFile(new File(icons, "attributes_halal_card_icon.png").getAbsolutePath(), doc);
        PDImageXObject imgVegan = PDImageXObject.createFromFile(new File(icons, "attributes_vegan_icon.png").getAbsolutePath(), doc);
        PDImageXObject imgCaf   = PDImageXObject.createFromFile(new File(icons, "attributes_contains_caffeine_icon.png").getAbsolutePath(), doc);
        PDImageXObject imgCC    = PDImageXObject.createFromFile(new File(icons, "allergen_cc_may_contain_icon.png").getAbsolutePath(), doc);

        int perPage = COLS * ROWS;
        int pages   = Math.max(1, (int)Math.ceil(cards.size() / (double)perPage));

        for (int p = 0; p < pages; p++){
          PDPage page = new PDPage(new PDRectangle(PAGE_W, PAGE_H));
          doc.addPage(page);

          try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
            // white page background
            cs.setNonStrokingColor(Color.WHITE);
            cs.addRect(0, 0, PAGE_W, PAGE_H);
            cs.fill();

            float cardW = in2pt(CARD_W_IN), cardH = in2pt(CARD_H_IN);
            float startX = in2pt(START_X_IN), startYTop = in2pt(START_Y_IN);
            float gapX = in2pt(GAP_X_IN), gapY = in2pt(GAP_Y_IN);

            for (int r = 0; r < ROWS; r++){
              for (int c = 0; c < COLS; c++){
                int idx = p*perPage + r*COLS + c;
                Card card = idx < cards.size() ? cards.get(idx) : null;

                float x = startX + c*(cardW + gapX);
                float yTopFromTop = startYTop + r*(cardH + gapY);
                float y = PAGE_H - yTopFromTop - cardH;

                // card area
                cs.setNonStrokingColor(Color.WHITE);
                cs.addRect(x, y, cardW, cardH);
                cs.fill();
                if (DRAW_CARD_OUTLINE) {
                  cs.setStrokingColor(COL_BORDER);
                  cs.setLineWidth(0.5f);
                  cs.addRect(x, y, cardW, cardH);
                  cs.stroke();
                }
                if (card == null) continue;

                List<String> attrs = card.attributes != null ? card.attributes : List.of();
                List<String> allergens = card.allergens != null ? card.allergens : List.of();

                // badges (including cc_all)
                float badgeSizeIn = 0.57f;
                List<PDImageXObject> badgeImgs = new ArrayList<>();
                if (attrs.contains("halal"))    badgeImgs.add(imgHalal);
                if (attrs.contains("vegan"))    badgeImgs.add(imgVegan);
                if (attrs.contains("caffeine")) badgeImgs.add(imgCaf);
                if (allergens.contains("cc_all")) badgeImgs.add(imgCC);
                if (badgeImgs.size() >= 3) badgeSizeIn = 0.45f;

                float bsz = in2pt(badgeSizeIn);
                float bpad = in2pt(0.08);
                float bx = x + cardW - bpad - bsz;
                float by = y + cardH - bpad - bsz;
                for (PDImageXObject img : badgeImgs){
                  cs.drawImage(img, bx, by, bsz, bsz);
                  bx -= (bsz + in2pt(0.08));
                }

                // ----- build wrapped text -----
                String name = card.name != null ? card.name.trim() : "";

                List<String> allergenList = new ArrayList<>();
                if (card.allergens != null) for (String k : card.allergens) allergenList.add(LABEL.getOrDefault(k, k));
                if (card.customAllergens != null) allergenList.addAll(card.customAllergens);
                String allergensStr = allergenList.isEmpty() ? null : "Allergens: " + String.join(", ", allergenList);

                List<String> containsList = new ArrayList<>();
                if (card.colors != null)   for (String k : card.colors)   containsList.add(LABEL.getOrDefault(k, k));
                if (card.textures != null) for (String k : card.textures) containsList.add(LABEL.getOrDefault(k, k));
                if (attrs.contains("caffeine")) containsList.add(LABEL.get("caffeine"));
                String containsStr = containsList.isEmpty() ? null : "Contains: " + String.join(", ", containsList);

                float usableW = cardW - 2*CARD_PAD_X;
                float usableH = cardH - 2*CARD_PAD_Y;

                // wrap each block
                List<String> nameLines      = wrapText(fontName,  NAME_SIZE, name,         usableW);
                List<String> allergensLines = allergensStr==null ? List.of() : wrapText(fontBebas, LINE_SIZE, allergensStr, usableW);
                List<String> containsLines  = containsStr==null  ? List.of() : wrapText(fontBebas, LINE_SIZE, containsStr,  usableW);

                // If all lines would exceed card height, drop/truncate from the bottom with ellipsis
                List<Line> flow = new ArrayList<>();
                for (String s : nameLines)      flow.add(new Line(s, fontName,  NAME_SIZE, COL_BLACK));
                for (String s : allergensLines) flow.add(new Line(s, fontBebas, LINE_SIZE, COL_RED));
                for (String s : containsLines)  flow.add(new Line(s, fontBebas, LINE_SIZE, COL_GRAY));

                float totalH = 0;
                for (int i=0;i<flow.size();i++) totalH += flow.get(i).size + (i>0 ? LINE_GAP : 0);

                // trim with ellipsis if too tall
                if (totalH > usableH) {
                  // available line slots
                  int maxLines = (int)Math.floor((usableH + LINE_GAP) / (LINE_SIZE + LINE_GAP));
                  // ensure at least name line shows
                  maxLines = Math.max(1, maxLines);
                  if (flow.size() > maxLines) {
                    flow = flow.subList(0, maxLines);
                    // add ellipsis to the last line if it isn't already short
                    Line last = flow.get(flow.size()-1);
                    String clipped = addEllipsisToFit(last.text, last.font, last.size, usableW);
                    flow.set(flow.size()-1, new Line(clipped, last.font, last.size, last.color));
                  }
                  // recompute height
                  totalH = 0;
                  for (int i=0;i<flow.size();i++) totalH += flow.get(i).size + (i>0 ? LINE_GAP : 0);
                }

                float cy = y + (cardH + totalH)/2f - flow.get(0).size;
                float cx = x + cardW/2f;

                for (int i=0;i<flow.size();i++){
                  Line ln = flow.get(i);
                  drawCenteredText(cs, ln.font, ln.size, ln.text, cx, cy, ln.color);
                  cy -= (ln.size + LINE_GAP);
                }
              }
            }
          }
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        doc.save(baos);
        return baos.toByteArray();
      }
    }

    // ---------- text utilities ----------
    private record Line(String text, PDType0Font font, float size, Color color) {}

    private float textWidth(PDType0Font font, float size, String s) throws IOException {
      return font.getStringWidth(s)/1000f * size;
    }

    private List<String> wrapText(PDType0Font font, float size, String text, float maxW) throws IOException {
      if (text == null || text.isBlank()) return List.of("");
      List<String> out = new ArrayList<>();
      List<String> words = new ArrayList<>(Arrays.asList(text.split("\\s+")));
      StringBuilder line = new StringBuilder();

      while (!words.isEmpty()){
        String word = words.remove(0);
        String trial = (line.length()==0 ? word : line + " " + word);
        if (textWidth(font, size, trial) <= maxW){
          line.setLength(0); line.append(trial);
        } else {
          if (line.length()==0){
            // single word longer than width -> hard cut with ellipsis
            out.add(hardClipWithEllipsis(font, size, word, maxW));
          } else {
            out.add(line.toString());
            line.setLength(0);
            // try the word again on a new line
            words.add(0, word);
          }
        }
      }
      if (line.length()>0) out.add(line.toString());
      return out;
    }

    private String hardClipWithEllipsis(PDType0Font font, float size, String s, float maxW) throws IOException {
      String ell = "…";
      for (int i = Math.max(1, s.length()-1); i>=1; i--){
        String cand = s.substring(0, i) + ell;
        if (textWidth(font, size, cand) <= maxW) return cand;
      }
      return ell;
    }

    private String addEllipsisToFit(String s, PDType0Font font, float size, float maxW) throws IOException {
      if (textWidth(font, size, s) <= maxW) return s;
      String ell = "…";
      while (s.length()>1 && textWidth(font, size, s + ell) > maxW){
        s = s.substring(0, s.length()-1);
      }
      return s + ell;
    }

    private void drawCenteredText(PDPageContentStream cs, PDType0Font font, float size,
                                  String text, float centerX, float baselineY, Color color) throws IOException {
      cs.setNonStrokingColor(color);
      cs.setFont(font, size);
      float w = textWidth(font, size, text);
      float x = centerX - w/2f;
      cs.beginText();
      cs.newLineAtOffset(x, baselineY);
      cs.showText(text);
      cs.endText();
    }
  }
}
