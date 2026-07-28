import React from 'react';
import { motion } from 'framer-motion';

const Logo = () => {
    const text = "Naxxivo";
    return (
        <motion.h1
          {...{
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.5 },
          } as any}
          className="font-logo text-5xl text-[var(--theme-text)]"
          aria-label={text}
        >
          {text}
        </motion.h1>
    );
};

export default Logo;