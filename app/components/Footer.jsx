import Logo from '../../public/logo.svg';
import Image from 'next/image';

import Button from '@mui/material/Button';
import Link from 'next/link';
import Privacy from './PrivacyOffCanvas';
import Terms from './TermsOffCanvas';
import SocialMediaButtonGroup from './SocialMediaGroupButton'

const Footer = () => {

  const date = new Date();
  const year = date.getFullYear();
  
  return (
    <div className='  tw-bg-lighterblue'>
      <div className=' container md:tw-flex tw-py-5 md:tw-justify-between'>
        <div className=''>
          <Link className='tw-no-underline tw-text-3xl tw-text-white tw-font-body hover:tw-text-yellow' href='/' >@JH Studios</Link>
          <p className='tw-text-white tw-font-header'> Copyright &copy; {year}. All Rights Reversed</p>
        </div>
        <div className=' tw-flex tw-flex-col'>
          <div className='tw-flex tw-font-header tw-text-white'>
            <Privacy name= 'Privacy Policy' placement='start'/> |
            <Terms name= 'Terms of Use' placement='start' />
          </div>
        <div >
          <SocialMediaButtonGroup />
        </div>
        <p className='tw-text-white tw-font-header'>For Questions or Support, email at jaiquezmanage98@gmail.com</p>
      </div>
      </div>
    </div>
  )
}

export default Footer;
