export type ReadingDocument = {
  title: string
  content: string
}

export type ReadingQuestion = {
  id: string
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  explanation: string
}

export type ToeicReadingPassage = {
  id: string
  type: 'single' | 'double' | 'triple'
  category: string
  title: string
  documents: ReadingDocument[]
  questions: ReadingQuestion[]
}

export const LOCAL_READING_PASSAGES: ToeicReadingPassage[] = [
  {
    id: 'rp-single-1',
    type: 'single',
    category: 'Operations',
    title: 'Đoạn đơn: Chuỗi tin nhắn nhóm trực tuyến (Online Chat Discussion)',
    documents: [
      {
        title: 'Văn bản 1: Nội bộ công ty (Internal Chat log)',
        content: `[09:15 AM] Sarah Jenkins: Hello team, has anyone reviewed the server logs from last night? The ERP upgrade was supposed to be completed by 04:00 AM, but I am still experiencing sluggish response times in the invoicing module.
[09:18 AM] Marcus Vance: Hi Sarah, yes, I looked into it. The database migration took longer than anticipated because of some mismatched table indexes. We officially wrapped up the deployment at 07:30 AM.
[09:20 AM] David Cole: That explains why the customer database was temporarily offline during my early client call. Marcus, is the synchronization fully resolved now, or should we anticipate further latency?
[09:22 AM] Marcus Vance: The database is synchronized, but the cache servers are still rebuilding indexes. The system response times should return to normal by noon. Barring any unexpected spikes in traffic, we should be fine.
[09:25 AM] Sarah Jenkins: Thanks for the update, Marcus. I will hold off on processing the bulk billing run until this afternoon just to be on the safe side.`
      }
    ],
    questions: [
      {
        id: 'rp-single-1-q1',
        question: 'Why did the system upgrade take longer than scheduled?',
        options: {
          A: 'Because the network traffic spiked unexpectedly.',
          B: 'Because the customer database was taken offline deliberately.',
          C: 'Because of issues related to database table indexing.',
          D: 'Because the invoicing module required a complete redesign.'
        },
        correctAnswer: 'C',
        explanation: 'Dấu hiệu/Dẫn chứng: Vào lúc 09:18 AM, Marcus Vance giải thích: "The database migration took longer than anticipated because of some mismatched table indexes" (Việc di trú cơ sở dữ liệu mất nhiều thời gian hơn dự kiến do một số chỉ mục bảng không khớp nhau). Do đó, đáp án đúng là C.'
      },
      {
        id: 'rp-single-1-q2',
        question: 'At 09:25 AM, what does Sarah Jenkins imply when she writes, "I will hold off on processing the bulk billing run"?',
        options: {
          A: 'She plans to cancel the invoicing run permanently.',
          B: 'She will wait for the system performance to stabilize before continuing.',
          C: 'She wants Marcus to manually process the invoices for her.',
          D: 'She needs to contact customers to warn them of billing errors.'
        },
        correctAnswer: 'B',
        explanation: 'Dấu hiệu/Dẫn chứng: Sarah nói cô ấy sẽ hoãn việc xử lý hóa đơn số lượng lớn (bulk billing) cho đến chiều nay để "an toàn" (just to be on the safe side), sau khi Marcus báo hệ thống sẽ hoạt động bình thường vào giữa ngày (noon). Điều này ngụ ý cô muốn đợi hệ thống ổn định hiệu năng rồi mới làm việc nặng. Đáp án đúng là B.'
      }
    ]
  },
  {
    id: 'rp-double-1',
    type: 'double',
    category: 'Purchasing',
    title: 'Đoạn kép: Thư điện tử & Hóa đơn thu mua (Email & Invoice)',
    documents: [
      {
        title: 'Văn bản 1: Thư điện tử thương lượng (Email)',
        content: `To: sales@apexsupplies.com
From: j.woodward@quantumtech.com
Date: October 14
Subject: Discrepancy in Invoice #AP-98421

Dear Sales Team,

I am writing to address a minor discrepancy in the invoice we received yesterday regarding our recent bulk order of executive office chairs (Invoice #AP-98421). 

According to our supply agreement signed on September 1, Quantum Technologies is entitled to a 15% volume discount on any single order of furniture exceeding $10,000 in value. The invoice total for the 50 ergonomic mesh chairs is listed as $12,500 (unit price of $250). However, the 15% discount was not applied to the subtotal before calculating shipping and tax. 

Please adjust the invoice accordingly and send a revised version. Barring any delays in receiving the updated invoice, we will process the bank transfer immediately to ensure prompt payment.

Sincerely,
Jonathan Woodward
Purchasing Manager, Quantum Technologies`
      },
      {
        title: 'Văn bản 2: Hóa đơn ban đầu (Original Invoice)',
        content: `APEX OFFICE SUPPLIES
100 Industrial Parkway, Chicago, IL 60611
INVOICE #AP-98421

Date: October 13
Bill To: Quantum Technologies (Attn: Jonathan Woodward)

Description: Ergonomic Mesh Office Chair (Model: EM-500)
Quantity: 50
Unit Price: $250.00
Subtotal: $12,500.00
Volume Discount (15%): $0.00 (NOT APPLIED)

Shipping & Handling: $450.00
Sales Tax (8% on Subtotal): $1,000.00
Total Amount Due: $13,950.00

Payment Terms: Net 30 days from invoice date.`
      }
    ],
    questions: [
      {
        id: 'rp-double-1-q1',
        question: 'What is the purpose of Mr. Woodward’s email?',
        options: {
          A: 'To cancel an order for executive office chairs.',
          B: 'To request an adjustment to an incorrect billing statement.',
          C: 'To terminate the supply agreement signed on September 1.',
          D: 'To complain about the shipping quality of model EM-500.'
        },
        correctAnswer: 'B',
        explanation: 'Dấu hiệu/Dẫn chứng: Trong thư, ông Woodward viết: "I am writing to address a minor discrepancy in the invoice..." (Tôi viết thư này để giải quyết một sự bất đồng bộ/lệch nhỏ trong hóa đơn...) và yêu cầu áp dụng mức giảm giá 15%. Do đó, mục đích thư là yêu cầu điều chỉnh hóa đơn tính sai. Chọn B.'
      },
      {
        id: 'rp-double-1-q2',
        question: 'What should the correct discount amount be on the revised invoice?',
        options: {
          A: '$250.00',
          B: '$450.00',
          C: '$1,000.00',
          D: '$1,875.00'
        },
        correctAnswer: 'D',
        explanation: 'Dấu hiệu và Tính toán chéo: Theo hóa đơn, Subtotal là $12,500. Thư điện tử nêu Quantum Tech được giảm giá 15% trên giá trị đơn hàng nếu vượt quá $10,000. Mức giảm giá đúng phải là: $12,500 x 15% = $1,875. Đáp án đúng là D.'
      },
      {
        id: 'rp-double-1-q3',
        question: 'What will Quantum Technologies do as soon as they receive the adjusted invoice?',
        options: {
          A: 'Order another batch of office furniture.',
          B: 'Conduct a vendor performance evaluation.',
          C: 'Submit a bank transfer payment.',
          D: 'Arrange a meeting with Apex Executives.'
        },
        correctAnswer: 'C',
        explanation: 'Dấu hiệu/Dẫn chứng: Ông Woodward kết luận: "we will process the bank transfer immediately to ensure prompt payment" (chúng tôi sẽ thực hiện chuyển khoản ngân hàng ngay lập tức để đảm bảo thanh toán nhanh chóng). Đáp án đúng là C.'
      }
    ]
  },
  {
    id: 'rp-triple-1',
    type: 'triple',
    category: 'Logistics',
    title: 'Đoạn ba: Thông báo, Thư điện tử & Biểu mẫu vận chuyển (Memo, Email & Form)',
    documents: [
      {
        title: 'Văn bản 1: Thông báo chính sách vận chuyển (Internal Memo)',
        content: `VANGUARD LOGISTICS CO.
MEMORANDUM

To: All Logistics Staff
From: Clara Dupont, Director of Operations
Date: June 1
Subject: Updated International Shipping Guidelines

Effective July 1, Vanguard Logistics will implement a new compliance check protocol for all international cargo. Due to new customs regulations in the European Union, a fully completed Customs Declaration Form (CDF-2026) must be submitted electronically at least 48 hours prior to cargo departure. 

Additionally, for high-priority shipments (labeled Priority Gold), staff must ensure that the secondary inspection signature is acquired from the port supervisor. Failure to comply with these rules will result in immediate customs holds at destination ports, and the responsible department will absorb any subsequent demurrage fees.`
      },
      {
        title: 'Văn bản 2: Thư điện tử gửi khách hàng (Email)',
        content: `To: shipping@vanguardlogistics.com
From: h.sato@yamatomotors.jp
Date: June 20
Subject: Urgent Shipment - Priority Gold Request

Dear Vanguard Team,

We have a high-priority cargo of prototype automotive components that needs to be shipped from our Tokyo plant to our Munich research facility. The delivery deadline is extremely tight as the research team requires the parts for a product demonstration scheduled for July 6. 

Since this shipment is scheduled to depart on July 2, it will fall under the new compliance guidelines mentioned in your recent memo. We have registered this as a "Priority Gold" shipment. Please ensure all Customs Declaration Forms are processed on our behalf. We have submitted the online request form today with all the shipping specifics.

Best regards,
Hiroshi Sato
Logistics Coordinator, Yamato Motors`
      },
      {
        title: 'Văn bản 3: Biểu mẫu yêu cầu trực tuyến (Online Shipping Form)',
        content: `VANGUARD LOGISTICS - ONLINE REQUEST FORM

Submission Date: June 20
Client Name: Yamato Motors (Hiroshi Sato)
Cargo Description: Prototype Automotive Parts (Box Type: CR-3)
Weight: 850 kg
Departure Port: Port of Tokyo (Japan)
Destination Port: Port of Hamburg (Germany)
Departure Date: July 2
Shipment Tier: Priority Gold
Customs Declaration CDF-2026: Attached (Completed)`
      }
    ],
    questions: [
      {
        id: 'rp-triple-1-q1',
        question: 'When will the new compliance check protocol become effective?',
        options: {
          A: 'June 1',
          B: 'June 20',
          C: 'July 1',
          D: 'July 6'
        },
        correctAnswer: 'C',
        explanation: 'Dấu hiệu/Dẫn chứng: Văn bản 1 (Memo) ghi rõ: "Effective July 1, Vanguard Logistics will implement a new compliance check..." (Có hiệu lực từ ngày 1 tháng 7, Vanguard Logistics sẽ áp dụng giao thức kiểm tra tuân thủ mới...). Chọn C.'
      },
      {
        id: 'rp-triple-1-q2',
        question: 'Who is required to sign off on Yamato Motors’ shipment in Tokyo?',
        options: {
          A: 'Clara Dupont',
          B: 'Hiroshi Sato',
          C: 'A port supervisor',
          D: 'A Munich customs inspector'
        },
        correctAnswer: 'C',
        explanation: 'Dấu hiệu/Dẫn chứng liên kết văn bản: Văn bản 2 và 3 cho thấy chuyến hàng của Yamato Motors thuộc diện "Priority Gold". Văn bản 1 (Memo) nêu rõ đối với các chuyến hàng Priority Gold: "staff must ensure that the secondary inspection signature is acquired from the port supervisor" (nhân viên phải đảm bảo lấy được chữ ký kiểm tra phụ từ giám sát cảng). Do đó người ký là giám sát cảng (port supervisor). Chọn C.'
      },
      {
        id: 'rp-triple-1-q3',
        question: 'What document did Hiroshi Sato attach to the online shipping form?',
        options: {
          A: 'An internal memorandum',
          B: 'Form CDF-2026',
          C: 'A Munich demonstration schedule',
          D: 'A secondary inspection waiver'
        },
        correctAnswer: 'B',
        explanation: 'Dấu hiệu/Dẫn chứng: Biểu mẫu trực tuyến (Văn bản 3) ghi: "Customs Declaration CDF-2026: Attached (Completed)" (Tờ khai hải quan CDF-2026: Đính kèm (Đã hoàn thành)). Do đó, tài liệu đính kèm là biểu mẫu CDF-2026. Chọn B.'
      },
      {
        id: 'rp-triple-1-q4',
        question: 'What is implied about the shipping department if they fail to process the paperwork on time?',
        options: {
          A: 'They will have to pay additional fees out of their own budget.',
          B: 'They will be forced to change the departure date to July 6.',
          C: 'They will lose Yamato Motors as a client permanently.',
          D: 'They will have to reroute the cargo to another port.'
        },
        correctAnswer: 'A',
        explanation: 'Dấu hiệu/Dẫn chứng: Văn bản 1 (Memo) ghi: "Failure to comply... will result in immediate customs holds... and the responsible department will absorb any subsequent demurrage fees" (Không tuân thủ... sẽ dẫn đến việc giữ hải quan ngay lập tức... và bộ phận chịu trách nhiệm sẽ phải tự chi trả các khoản phí lưu kho/bãi phát sinh). Điều này nghĩa là họ phải trả thêm tiền từ ngân sách riêng. Chọn A.'
      }
    ]
  }
]
