/*
 * Copyright (C) 2013 Glyptodon LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

package org.glyptodon.guacamole.xml.protocol;

import org.glyptodon.guacamole.form.ParameterOption;
import org.glyptodon.guacamole.xml.TagHandler;
import org.xml.sax.Attributes;
import org.xml.sax.SAXException;

/**
 * TagHandler for the "option" element.
 *
 * @author Mike Jumper
 */
public class OptionTagHandler implements TagHandler {

    /**
     * The option backing this option tag.
     */
    private ParameterOption option = new ParameterOption();

    @Override
    public void init(Attributes attributes) throws SAXException {
        option.setValue(attributes.getValue("value"));
    }

    @Override
    public TagHandler childElement(String localName) throws SAXException {
        throw new SAXException("The 'param' tag can contain no elements.");
    }

    @Override
    public void complete(String textContent) throws SAXException {
        option.setTitle(textContent);
    }

    /**
     * Returns the ParameterOption backing this tag.
     * @return The ParameterOption backing this tag.
     */
    public ParameterOption asParameterOption() {
        return option;
    }

}
