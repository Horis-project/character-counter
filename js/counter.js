/* =============================================
   文字数カウンター - JavaScript
   =============================================
   このファイルはページの「動き」を担当します。
   HTMLが「骨格」、CSSが「見た目」なら、
   JavaScriptは「機能（動作）」です。
============================================= */


/* =============================================
   1. HTML要素を取得する
   =============================================
   JavaScript から HTML の部品を操作するには、
   まず「どの要素か」を取得する必要があります。
   document.getElementById('id名') で取得できます。
============================================= */

// テキストエリア（文字を入力する欄）
const textarea = document.getElementById('input-text');

// カウント結果を表示する3つのspan要素
const totalCharsEl    = document.getElementById('total-chars');     // 総文字数
const noSpaceCharsEl  = document.getElementById('no-space-chars');  // 空白除外文字数
const linesEl         = document.getElementById('lines');           // 行数

// クリアボタン
const clearBtn = document.getElementById('clear-btn');

// ── 追加：上限機能に関係する要素 ──
const limitInput    = document.getElementById('limit-input');     // 上限数値の入力欄
const limitClearBtn = document.getElementById('limit-clear-btn'); // 上限解除ボタン
const progressArea  = document.getElementById('progress-area');   // プログレスバー全体
const progressFill  = document.getElementById('progress-fill');   // バーの塗り部分
const progressText  = document.getElementById('progress-text');   // 「○○ / △△文字」テキスト
const progressPct   = document.getElementById('progress-percent');// パーセント表示

// querySelectorAll でクラス名からまとめて取得（複数ある場合に便利）
// プリセットボタンは4つあるので、全部まとめてリストとして取得する
const presetBtns = document.querySelectorAll('.btn--preset');

// 総文字数カードの数値部分（超過時に赤くするため取得しておく）
const totalCharsCard = document.querySelector('#total-chars');

// 読了時間・原稿用紙換算の表示要素
const readingTimeEl = document.getElementById('reading-time'); // 読了時間
const manuscriptEl  = document.getElementById('manuscript');   // 原稿用紙換算


/* =============================================
   2. 状態（State）管理
   =============================================
   「現在、上限文字数は何文字に設定されているか」を
   変数として保持します。

   null = 上限なし（未設定）
   数値 = その文字数が上限
============================================= */

// 上限文字数を格納する変数（初期値は null = 未設定）
let currentLimit = null;


/* =============================================
   3. カウント計算関数（このサービスの核心部分）
   =============================================
   「純粋関数」として定義します。
   純粋関数とは：
     - 引数（入力）を受け取る
     - 計算して結果を返すだけ
     - 画面の操作や外部への影響を与えない

   こうすると、テストしやすく、読みやすいコードになります。
============================================= */

/**
 * テキストの文字数情報を計算して返す関数
 *
 * @param {string} text - カウント対象のテキスト
 * @returns {object} - 各種カウント結果をまとめたオブジェクト
 */
function countAll(text) {

  // ── 総文字数 ──────────────────────────────
  // .length でテキストの文字数が取得できます
  // 例: "abc".length → 3 / "あいう".length → 3
  const totalChars = text.length;


  // ── スペース・改行を除いた文字数 ──────────
  // .replace() で特定の文字を別の文字に置き換えられます
  // 正規表現 /\s/g の意味：
  //   \s  = スペース・タブ・改行などの「空白文字」全部
  //   g   = global（テキスト全体で繰り返し置換）
  // つまり「空白文字をすべて空文字（削除）」してから文字数を数えます
  const noSpaceChars = text.replace(/\s/g, '').length;


  // ── 行数 ──────────────────────────────────
  // テキストが空のとき：行数は 0
  // テキストがあるとき：改行（\n）で分割して配列の要素数を数える
  //
  // 例: "ABC\nDEF\nGHI".split('\n') → ["ABC", "DEF", "GHI"] → .length = 3
  const lines = text === '' ? 0 : text.split('\n').length;


  // ── 読了時間 ──────────────────────────────
  // 日本語の平均読書速度は約400文字/分といわれています
  // 総文字数 ÷ 400 で読了時間（分）を計算します
  // Math.ceil() は小数点以下を切り上げる
  //   例: 500文字 → 500 / 400 = 1.25 → 切り上げて 2分
  //   例: 400文字 → 400 / 400 = 1.0  → 1分
  //   例: 0文字   → 0   / 400 = 0    → 0分
  const readingTime = totalChars === 0 ? 0 : Math.ceil(totalChars / 400);


  // ── 原稿用紙換算 ──────────────────────────
  // 一般的な400字詰め原稿用紙（20字 × 20行）での枚数を計算します
  // 空白除外文字数（実質文字数）を使って計算するのが一般的です
  // Math.ceil() で小数点以下を切り上げ（0.5枚 → 1枚と数える）
  //   例: 800文字 → 800 / 400 = 2.0 → 2枚
  //   例: 500文字 → 500 / 400 = 1.25 → 切り上げて 2枚
  //   例: 0文字   → 0   / 400 = 0   → 0枚
  const manuscript = noSpaceChars === 0 ? 0 : Math.ceil(noSpaceChars / 400);


  // 結果をオブジェクト（名前付きのデータの集まり）として返す
  return {
    totalChars,    // 総文字数
    noSpaceChars,  // 空白除外文字数
    lines,         // 行数
    readingTime,   // 読了時間（分）
    manuscript,    // 原稿用紙換算（枚）
  };
}


/* =============================================
   4. 画面を更新する関数
   =============================================
   計算結果を受け取って、HTML の数値を書き換えます。
   「計算」と「画面操作」を分けることで、
   それぞれの役割が明確になります。
============================================= */

/**
 * カウント結果を画面に反映する関数
 *
 * @param {object} counts - countAll() が返したオブジェクト
 */
function updateDisplay(counts) {

  // textContent でHTMLの要素のテキストを書き換えられます
  // toLocaleString() で数値を「1,234」のような桁区切り形式に変換
  totalCharsEl.textContent   = counts.totalChars.toLocaleString();
  noSpaceCharsEl.textContent = counts.noSpaceChars.toLocaleString();
  linesEl.textContent        = counts.lines.toLocaleString();

  // ── 読了時間の表示更新 ──
  // innerHTML を使うのは、数値の後ろに <span> タグの単位を含むため
  // ※ textContent だとタグが文字列として表示されてしまう
  readingTimeEl.innerHTML =
    `${counts.readingTime.toLocaleString()}<span class="card__number-unit">分</span>`;

  // ── 原稿用紙換算の表示更新 ──
  manuscriptEl.innerHTML =
    `${counts.manuscript.toLocaleString()}<span class="card__number-unit">枚</span>`;

  // 上限が設定されているときは、プログレスバーも更新する
  if (currentLimit !== null) {
    updateProgressBar(counts.totalChars);
  }
}


/* =============================================
   5. プログレスバー更新関数（追加機能）
   =============================================
   「現在の文字数 ÷ 上限文字数 × 100」でパーセントを計算して、
   バーの幅と色をリアルタイムで変えます。
============================================= */

/**
 * プログレスバーを更新する関数
 *
 * @param {number} currentChars - 現在の文字数（総文字数）
 */
function updateProgressBar(currentChars) {

  // パーセントを計算する
  // Math.round() で小数点以下を四捨五入
  // 例: 70 / 140 * 100 = 50 → 50%
  const percent = Math.round((currentChars / currentLimit) * 100);

  // バーの表示幅は最大100%にする（超過しても100%で止める）
  // Math.min(a, b) は a と b の小さい方を返す
  const barWidth = Math.min(percent, 100);

  // 超過しているかどうかを判定（true か false）
  const isOver = currentChars > currentLimit;

  // ── テキスト更新 ──
  // 「現在文字数 / 上限文字数 文字」の形式で表示
  progressText.textContent =
    `${currentChars.toLocaleString()} / ${currentLimit.toLocaleString()} 文字`;

  // パーセント表示（超過時は「110%」のように100超えも表示）
  progressPct.textContent = `${percent}%`;

  // ── バーの幅を変える ──
  // style.width で直接CSSのwidthプロパティを書き換える
  progressFill.style.width = `${barWidth}%`;

  // ── 超過時の警告スタイルを切り替える ──
  // classList.toggle('クラス名', 条件) → 条件がtrueならクラスを追加、falseなら削除
  progressFill.classList.toggle('progress-bar__fill--over', isOver);
  progressPct.classList.toggle('progress-info__percent--over', isOver);
  totalCharsCard.classList.toggle('card__number--over', isOver);
}


/* =============================================
   6. 上限を設定する関数（追加機能）
   =============================================
   上限値を受け取って、状態変数と画面を更新します。
   null を渡すと「上限なし（解除）」の状態になります。
============================================= */

/**
 * 文字数の上限を設定する関数
 *
 * @param {number|null} limit - 上限文字数。null のとき上限解除。
 */
function setLimit(limit) {

  // 状態変数を更新する
  currentLimit = limit;

  if (limit === null) {
    // ── 上限解除のとき ──

    // プログレスバーを非表示にする（CSSで display:none になるクラスを追加）
    progressArea.classList.add('progress-area--hidden');

    // 数値入力欄を空にする
    limitInput.value = '';

    // 文字数カードの赤色警告を解除する
    totalCharsCard.classList.remove('card__number--over');

    // アクティブなプリセットボタンの選択状態を解除する
    clearActivePreset();

  } else {
    // ── 上限設定のとき ──

    // プログレスバーを表示する（非表示クラスを削除）
    progressArea.classList.remove('progress-area--hidden');

    // 現在の文字数でプログレスバーをすぐに更新する
    const currentChars = textarea.value.length;
    updateProgressBar(currentChars);
  }
}


/* =============================================
   7. プリセットボタンのアクティブ状態を管理する関数
   =============================================
   「選択中のプリセット」を視覚的に示すために、
   クリックしたボタンにだけ active クラスをつけます。
============================================= */

/**
 * 全プリセットボタンの active クラスを外す（リセット）
 */
function clearActivePreset() {
  // forEach でリスト内の全ボタンに処理を繰り返す
  presetBtns.forEach(function(btn) {
    btn.classList.remove('btn--preset--active');
  });
}

/**
 * 指定したボタンを active にする
 *
 * @param {HTMLElement} targetBtn - active にしたいボタン要素
 */
function setActivePreset(targetBtn) {
  // まず全ボタンの active を外してから、
  clearActivePreset();
  // 指定したボタンだけ active をつける
  targetBtn.classList.add('btn--preset--active');
}


/* =============================================
   8. イベントリスナー（ユーザーの操作を検知する）
   =============================================
   addEventListener は「○○が起きたとき、△△する」という設定です。

   書き方：
   要素.addEventListener('イベント名', 実行する関数);

   主なイベント名：
   - 'input'  → テキストを入力 / 貼り付け / 削除したとき
   - 'click'  → クリックしたとき
   - 'change' → 値が変わってフォーカスが外れたとき
============================================= */

// ── テキストエリア：入力のたびにカウントを更新 ──
textarea.addEventListener('input', function() {

  // textarea.value で現在入力されているテキストを取得
  const text = textarea.value;

  // カウント計算（純粋関数を呼ぶ）
  const counts = countAll(text);

  // 画面を更新（プログレスバーも内部で更新される）
  updateDisplay(counts);
});


// ── クリアボタン：テキストを全消去 ──
clearBtn.addEventListener('click', function() {

  // テキストエリアの内容を空にする
  textarea.value = '';

  // カウントを 0 にリセット
  const counts = countAll('');
  updateDisplay(counts);

  // テキストエリアにフォーカスを戻す（すぐ入力できるように）
  textarea.focus();
});


// ── SNSプリセットボタン：クリックで上限を自動セット ──
// forEach で全プリセットボタンに同じイベントを設定する
presetBtns.forEach(function(btn) {
  btn.addEventListener('click', function() {

    // data-limit 属性から上限値を取得する
    // HTML: <button data-limit="140"> → '140' という文字列が取得できる
    // Number() で文字列を数値に変換する（'140' → 140）
    const limit = Number(btn.dataset.limit);

    // 数値入力欄にも値を反映する（見た目の一致）
    limitInput.value = limit;

    // このボタンを active 状態にする
    setActivePreset(btn);

    // 上限を設定する
    setLimit(limit);
  });
});


// ── 上限入力欄：値が変わったら上限を更新 ──
// 'change' イベントはフォーカスが外れたタイミングで発火する
limitInput.addEventListener('change', function() {

  // 入力値を数値に変換
  const value = Number(limitInput.value);

  if (limitInput.value === '' || value <= 0) {
    // 空欄またはゼロ以下なら上限を解除
    setLimit(null);
  } else {
    // プリセットボタンの選択状態を解除（手動入力したので）
    clearActivePreset();
    // 上限を設定
    setLimit(value);
  }
});


// ── 上限解除ボタン：上限設定をリセット ──
limitClearBtn.addEventListener('click', function() {
  setLimit(null);
});


/* =============================================
   9. 初期化処理
   =============================================
   ページを読み込んだ時点で一度実行して、
   初期状態（全カウント 0）を画面に表示します。
============================================= */

// ページ読み込み時に一度だけ実行
const initialCounts = countAll('');
updateDisplay(initialCounts);
