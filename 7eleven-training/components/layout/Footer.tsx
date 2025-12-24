'use client';

import Link from 'next/link';
import { BookOpen, FileText, HelpCircle, Shield, Cookie } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-semibold mb-4">เกี่ยวกับเรา</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  เกี่ยวกับเรา
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  ติดต่อเรา
                </Link>
              </li>
            </ul>
          </div>

          {/* Help Center */}
          <div>
            <h3 className="text-white font-semibold mb-4">ศูนย์ช่วยเหลือ</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="hover:text-white transition-colors flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  คำถามที่พบบ่อย
                </Link>
              </li>
              <li>
                <Link href="/certificates" className="hover:text-white transition-colors flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  ตรวจสอบใบวุฒิบัตร
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">ข้อตกลงและเงื่อนไข</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  ข้อตกลงและเงื่อนไขการใช้งานเว็บไซต์
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  การคุ้มครองข้อมูลส่วนบุคคล
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-white transition-colors flex items-center gap-2">
                  <Cookie className="h-4 w-4" />
                  นโยบายการใช้คุกกี้
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">ติดต่อเรา</h3>
            <ul className="space-y-2 text-sm">
              <li>7-Eleven Training Center</li>
              <li>Email: training@7eleven.co.th</li>
              <li>Tel: 0-2000-7777</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>© สงวนลิขสิทธิ์ {new Date().getFullYear() + 543} 7-Eleven Training System</p>
          <p className="mt-2 text-xs text-gray-500">
            เนื้อหาทั้งหมดบนเว็บไซต์นี้ มีขึ้นเพื่อวัตถุประสงค์ในการให้ข้อมูลและเพื่อการศึกษาเท่านั้น
          </p>
        </div>
      </div>
    </footer>
  );
}

