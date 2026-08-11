function app() {
  return {
    step: 1,
    stdId: '',
    subjectLang: 'ko',
    timetable: [],
    loading: false,
    error: '',
    modal: {
      open: false, isNew: false,
      kyosi: null, col: null,
      scope: 'one',        // 'one' = 클릭한 칸만, 'all' = 같은 과목 전체
      origSubject: '',     // 편집 시작 시점의 과목명
      slots: [],           // 저장 후 이 과목이 차지할 슬롯 키 목록
      data: { subject: '', class: '', teacher: '', room: '' }
    },
    config: {
      semesterStart: '2026-03-03',
      semesterEnd:   '2026-06-20',
      noClassDates: [
        '2026-03-02','2026-05-05','2026-05-25','2026-06-01','2026-06-06',
        '2026-04-14','2026-04-15','2026-04-16','2026-04-17',
        '2026-06-15','2026-06-16','2026-06-17','2026-06-18','2026-06-19'
      ]
    },

    I18N: {
      ko: {
        title: '시간표 캘린더 만들기',
        subtitle: '학번을 입력하면 시간표를 자동으로 불러옵니다',
        inputPlaceholder: '예: 24-074',
        fetchBtn: '찾기',
        step2Title: '시간표 편집',
        step2Subtitle: '셀을 클릭해 수업을 추가·수정·삭제하세요',
        back: '← 뒤로',
        next: '다음: 내보내기 →',
        days: { value1:'월', value2:'화', value3:'수', value4:'목', value5:'금' },
        step3Title: 'ICS 내보내기',
        step3Subtitle: '캘린더 앱에 가져올 수 있는 ICS 파일을 생성합니다',
        semesterSettings: '학기 설정',
        semesterStart: '학기 시작',
        semesterEnd: '학기 종료',
        calHintNoClass: '🚫 날짜를 클릭해 수업 없는 날(공휴일·시험기간)을 지정/해제하세요',
        legendSemester: '학기 기간',
        legendNoClass: '수업 없는 날',
        summaryLabel: '학기',
        noClassUnit: '일',
        downloadBtn: '⬇ ICS 파일 다운로드',
        guideTitle: '캘린더 앱에 추가하는 방법',
        modalSubject: '과목명',
        modalClass: '분반',
        modalTeacher: '교수',
        modalRoom: '강의실',
        modalSave: '저장',
        modalDelete: '삭제',
        modalCancel: '취소',
        modalSubjectPlaceholder: '예: 알고리즘(Algorithms)',
        modalClassPlaceholder: '예: 1분반',
        modalTeacherPlaceholder: '예: 홍길동',
        modalRoomPlaceholder: '예: 형3404',
        scopeOne: '이 칸만',
        scopeAll: '같은 과목 전체',
        slotPickerHint: '칸을 눌러 수업을 넣을 시간을 선택하세요',
        modalSaveAll: (n) => `${n}칸에 저장`,
        modalDeleteAll: (n) => `${n}칸 삭제`,
        toastApplied: (n) => `✓ ${n}개 칸에 적용했습니다`,
        toastDeleted: (n) => `✓ ${n}개 칸을 삭제했습니다`,
        toastLoaded: (id) => `✓ ${id} 시간표를 불러왔습니다`,
        errorEmpty: '학번을 입력해주세요.',
        errorServer: '서버에 연결할 수 없습니다.',
        gcal: 'Google Calendar',
        gcalSteps: ['Google Calendar 웹 접속', '왼쪽 하단 <b>다른 캘린더 +</b> 클릭', '<b>파일에서 가져오기</b> 선택', '다운로드한 .ics 파일 업로드 후 가져오기 클릭'],
        iphone: 'iPhone (Apple Calendar)',
        iphoneSteps: ['.ics 파일을 AirDrop 또는 이메일로 iPhone에 전송', '파일 앱에서 .ics 파일 탭', '<b>캘린더에 추가</b> 선택'],
        android: 'Android (모바일)',
        androidSteps: ['.ics 파일을 휴대폰에 다운로드', '<b>내 파일</b>(파일 관리자) 앱에서 .ics 파일 탭', '열기 앱으로 <b>캘린더</b>(또는 Google Calendar) 선택', '가져올 계정 확인 후 <b>저장</b>', '⚠️ 앱에서 안 열리면, 모바일 브라우저에서 <b>Google Calendar 웹</b>으로 접속해 설정 → 가져오기'],
        mac: 'Mac (Apple Calendar)',
        macSteps: ['다운로드한 .ics 파일을 더블클릭', '캘린더 앱이 열리며 가져오기 다이얼로그 표시', '<b>추가</b> 클릭'],
      },
      en: {
        title: 'Class Calendar',
        subtitle: 'Enter your student ID to load your timetable',
        inputPlaceholder: 'e.g. 24-074',
        fetchBtn: 'Search',
        step2Title: 'Edit Timetable',
        step2Subtitle: 'Click a cell to add, edit, or delete a class',
        back: '← Back',
        next: 'Next: Export →',
        days: { value1:'Mon', value2:'Tue', value3:'Wed', value4:'Thu', value5:'Fri' },
        step3Title: 'Export ICS',
        step3Subtitle: 'Generate an ICS file to import into your calendar app',
        semesterSettings: 'Semester Settings',
        semesterStart: 'Start Date',
        semesterEnd: 'End Date',
        calHintNoClass: '🚫 Click a date to toggle a no-class day (holiday / exam period)',
        legendSemester: 'Semester',
        legendNoClass: 'No-class',
        summaryLabel: 'Semester',
        noClassUnit: ' days',
        downloadBtn: '⬇ Download ICS File',
        guideTitle: 'How to import into your calendar app',
        modalSubject: 'Subject',
        modalClass: 'Section',
        modalTeacher: 'Instructor',
        modalRoom: 'Room',
        modalSave: 'Save',
        modalDelete: 'Delete',
        modalCancel: 'Cancel',
        modalSubjectPlaceholder: 'e.g. Algorithms',
        modalClassPlaceholder: 'e.g. Section 1',
        modalTeacherPlaceholder: 'e.g. John Smith',
        modalRoomPlaceholder: 'e.g. Hyeong 3404',
        scopeOne: 'This slot only',
        scopeAll: 'All slots of subject',
        slotPickerHint: 'Tap cells to pick the slots for this class',
        modalSaveAll: (n) => `Save to ${n} slots`,
        modalDeleteAll: (n) => `Delete ${n} slots`,
        toastApplied: (n) => `✓ Applied to ${n} slots`,
        toastDeleted: (n) => `✓ Deleted ${n} slots`,
        toastLoaded: (id) => `✓ Loaded timetable for ${id}`,
        errorEmpty: 'Please enter your student ID.',
        errorServer: 'Cannot connect to server.',
        gcal: 'Google Calendar',
        gcalSteps: ['Go to Google Calendar on the web', 'Click <b>Other calendars +</b> on the bottom left', 'Select <b>Import from file</b>', 'Upload the .ics file and click Import'],
        iphone: 'iPhone (Apple Calendar)',
        iphoneSteps: ['Send the .ics file to iPhone via AirDrop or email', 'Tap the .ics file in the Files app', 'Select <b>Add to Calendar</b>'],
        android: 'Android (Mobile)',
        androidSteps: ['Download the .ics file to your phone', 'Tap the .ics file in your <b>Files</b> (file manager) app', 'Choose to open it with <b>Calendar</b> (or Google Calendar)', 'Confirm the account and tap <b>Save</b>', '⚠️ If it won\'t open in the app, go to <b>Google Calendar web</b> in a mobile browser → Settings → Import'],
        mac: 'Mac (Apple Calendar)',
        macSteps: ['Double-click the downloaded .ics file', 'Calendar app opens with an import dialog', 'Click <b>Add</b>'],
      }
    },

    get t() { return this.I18N[this.subjectLang] || this.I18N.ko; },

    DAY_NAMES: { value1:'월', value2:'화', value3:'수', value4:'목', value5:'금' },
    VALUE_KEYS: ['value1','value2','value3','value4','value5'],

    dayName(col) { return (this.t.days || this.DAY_NAMES)[col] || ''; },

    showToast(msg) {
      const el = document.getElementById('toast');
      el.textContent = msg;
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), 2500);
    },

    renderGrid() {
      const root = document.getElementById('tt-grid-root');
      // 헤더 6개(빈칸+월~금)만 남기고 이전 셀 제거
      while (root.children.length > 6) root.removeChild(root.lastChild);

      const self = this;
      this.timetable.forEach((row, idx) => {
        const k = Number(row.kyosi);
        // 블록 경계(점심·야간)면 위쪽에 간격
        const blockTop = (k === 5 || k === 10) && idx > 0;

        // 교시 셀
        const kyosiEl = document.createElement('div');
        kyosiEl.className = 'tt-kyosi' + (blockTop ? ' block-top' : '');
        kyosiEl.innerHTML = `<span>${row.kyosi}</span><span>교시</span>`;
        root.appendChild(kyosiEl);

        // 요일 셀 5개
        this.VALUE_KEYS.forEach(col => {
          const info = row[col];
          const cell = document.createElement('div');
          cell.className = 'tt-cell ' + (info ? 'has-class' : 'empty') + (blockTop ? ' block-top' : '');
          if (info) {
            const subject = info.subject || '(무제)';
            const room = info.room ? `<span class="cell-room">${info.room}</span>` : '';
            cell.innerHTML = `<div class="cell-subject">${subject}</div>${room}`;
          } else {
            cell.innerHTML = '<span>+</span>';
          }
          cell.addEventListener('click', () => self.openModal(row.kyosi, col));
          root.appendChild(cell);
        });
      });
    },

    async fetchTimetable() {
      if (!this.stdId.trim()) { this.error = this.t.errorEmpty; return; }
      this.loading = true; this.error = '';
      try {
        const res  = await fetch(`/api/timetable?stdId=${encodeURIComponent(this.stdId.trim())}&lang=${this.subjectLang}`);
        const data = await res.json();
        if (!res.ok) { this.error = data.error || '오류가 발생했습니다.'; return; }
        this.timetable = data;
        this.showToast(this.t.toastLoaded(this.stdId));
        this.step = 2;
        this.$nextTick(() => this.renderGrid());
      } catch (e) {
        this.error = this.t.errorServer;
      } finally {
        this.loading = false;
      }
    },

    // ── 슬롯(요일 × 교시) 유틸 ──
    // 슬롯 키는 'value1|3' 형태 (요일키 | 교시)
    slotKey(col, kyosi) { return `${col}|${kyosi}`; },

    slotInfo(col, kyosi) {
      const row = this.timetable.find(r => String(r.kyosi) === String(kyosi));
      return row ? row[col] : null;
    },

    setSlot(key, value) {
      const [col, kyosi] = key.split('|');
      const row = this.timetable.find(r => String(r.kyosi) === kyosi);
      if (row) row[col] = value;
    },

    // 같은 과목명을 가진 모든 슬롯 키
    subjectSlots(subject) {
      const target = (subject || '').trim();
      if (!target) return [];
      const keys = [];
      this.timetable.forEach(row => {
        this.VALUE_KEYS.forEach(col => {
          const info = row[col];
          if (info && (info.subject || '').trim() === target) keys.push(this.slotKey(col, row.kyosi));
        });
      });
      return keys;
    },

    // ── 편집 모달 ──
    // 기존 수업 → '이 칸만 / 같은 과목 전체' 선택
    // 빈 칸 추가 → 칸을 눌러 여러 시간에 한 번에 추가
    openModal(kyosi, col) {
      const info = this.slotInfo(col, kyosi);
      this.modal = {
        open: true,
        isNew: !info,
        kyosi, col,
        scope: 'one',
        origSubject: info ? (info.subject || '') : '',
        slots: [this.slotKey(col, kyosi)],
        data: info ? { ...info } : { subject: '', class: '', teacher: '', room: '' }
      };
    },

    isSlotSelected(col, kyosi) { return this.modal.slots.includes(this.slotKey(col, kyosi)); },

    slotCellClass(col, kyosi) {
      const info = this.slotInfo(col, kyosi);
      const cls  = [];
      if (this.isSlotSelected(col, kyosi)) cls.push('sel');
      // 다른 과목이 이미 들어있는 칸 (선택 시 덮어쓰기)
      if (info && (info.subject || '').trim() !== this.modal.origSubject.trim()) cls.push('taken');
      if (Number(kyosi) === 5 || Number(kyosi) === 10) cls.push('block-top');
      return cls.join(' ');
    },

    toggleSlot(col, kyosi) {
      const key = this.slotKey(col, kyosi);
      const i   = this.modal.slots.indexOf(key);
      if (i >= 0) this.modal.slots.splice(i, 1);
      else this.modal.slots.push(key);
    },

    get modalTitle() {
      const en   = this.subjectLang === 'en';
      const what = this.modal.isNew ? (en ? 'Add Class' : '수업 추가') : (en ? 'Edit Class' : '수업 편집');
      return en
        ? `Period ${this.modal.kyosi} ${this.dayName(this.modal.col)} — ${what}`
        : `${this.modal.kyosi}교시 ${this.dayName(this.modal.col)} — ${what}`;
    },

    // 편집 중인 과목이 차지한 칸 수 (2 이상일 때만 범위 토글 표시)
    get sameSubjectCount() { return this.subjectSlots(this.modal.origSubject).length; },

    // 저장·삭제가 적용될 칸 목록
    get targetSlots() {
      if (this.modal.isNew) return this.modal.slots;
      return this.modal.scope === 'all'
        ? this.subjectSlots(this.modal.origSubject)
        : [this.slotKey(this.modal.col, this.modal.kyosi)];
    },

    saveModal() {
      const subject = (this.modal.data.subject || '').trim();
      if (!subject) return;
      const targets = this.targetSlots;
      if (!targets.length) return;

      const data = {
        subject,
        class:   (this.modal.data.class   || '').trim(),
        teacher: (this.modal.data.teacher || '').trim(),
        room:    (this.modal.data.room    || '').trim()
      };
      targets.forEach(k => this.setSlot(k, { ...data }));

      this.modal.open = false;
      if (targets.length > 1) this.showToast(this.t.toastApplied(targets.length));
      this.$nextTick(() => this.renderGrid());
    },

    deleteModal() {
      const targets = this.targetSlots;
      targets.forEach(k => this.setSlot(k, null));
      this.modal.open = false;
      if (targets.length > 1) this.showToast(this.t.toastDeleted(targets.length));
      this.$nextTick(() => this.renderGrid());
    },

    // ── 캘린더식 학기 설정 ──
    EN_MONTHS: ['January','February','March','April','May','June','July','August','September','October','November','December'],

    _iso(d) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },
    _parse(s) { return new Date(s + 'T00:00:00'); },

    _monthLabel(y, mo) {
      return this.subjectLang === 'en'
        ? `${this.EN_MONTHS[mo]} ${y}`
        : `${y}년 ${mo + 1}월`;
    },

    get weekdayHeaders() {
      return this.subjectLang === 'en'
        ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
        : ['일', '월', '화', '수', '목', '금', '토'];
    },

    // 학기 시작월 ~ 종료월까지의 달력 데이터
    get calendarMonths() {
      const s = this._parse(this.config.semesterStart);
      const e = this._parse(this.config.semesterEnd);
      if (isNaN(s) || isNaN(e)) return [];
      let cur = new Date(s.getFullYear(), s.getMonth(), 1);
      const last = new Date(e.getFullYear(), e.getMonth(), 1);
      const months = [];
      let guard = 0;
      while (cur <= last && guard < 36) {
        const y = cur.getFullYear(), mo = cur.getMonth();
        const firstDow = new Date(y, mo, 1).getDay();
        const daysInMonth = new Date(y, mo + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDow; i++) days.push(null);
        for (let d = 1; d <= daysInMonth; d++) {
          const dt = new Date(y, mo, d);
          days.push({ n: d, iso: this._iso(dt), dow: dt.getDay() });
        }
        months.push({ key: `${y}-${mo}`, label: this._monthLabel(y, mo), days });
        cur = new Date(y, mo + 1, 1);
        guard++;
      }
      return months;
    },

    dayClass(day) {
      if (!day) return 'blank';
      const cls = [];
      const iso = day.iso;
      const s = this.config.semesterStart, e = this.config.semesterEnd;
      if (day.dow === 0) cls.push('sun');
      if (day.dow === 6) cls.push('sat');
      if (s && e) {
        if (iso < s || iso > e) cls.push('outside');
        else cls.push('in-range');
      }
      if (this.config.noClassDates.includes(iso)) cls.push('no-class');
      return cls.join(' ');
    },

    // 날짜 클릭 → 수업 없는 날 지정/해제
    onDayClick(day) {
      const iso = day.iso;
      const i = this.config.noClassDates.indexOf(iso);
      if (i >= 0) this.config.noClassDates.splice(i, 1);
      else { this.config.noClassDates.push(iso); this.config.noClassDates.sort(); }
    },

    async downloadICS() {
      this.loading = true; this.error = '';
      try {
        const res = await fetch('/api/generate-ics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stdId: this.stdId, timetable: this.timetable, config: this.config, subjectLang: this.subjectLang })
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          this.error = d.error || '생성 중 오류가 발생했습니다.';
          return;
        }
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = `timetable_${this.stdId}.ics`;
        a.click(); URL.revokeObjectURL(url);
      } catch (e) {
        this.error = this.t.errorServer;
      } finally {
        this.loading = false;
      }
    }
  };
}
