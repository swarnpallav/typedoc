import type { DefaultThemeRenderContext } from "../DefaultThemeRenderContext";
import { JSX } from "../../../../utils";
import type { DeclarationReflection } from "../../../../models";

export const memberGetterSetter = (context: DefaultThemeRenderContext, props: DeclarationReflection) => (
    <>
        <ul class={"tsd-signatures " + props.cssClasses}>
            {!!props.getSignature && (
                <>
                    <li class="tsd-signature" id={props.getSignature.anchor}>
                        <span class="tsd-signature-symbol">get</span> {props.name}
                        {context.memberSignatureTitle(props.getSignature, {
                            hideName: true,
                        })}
                    </li>
                    <li class="tsd-description">{context.memberSignatureBody(props.getSignature)}</li>
                </>
            )}
            {!!props.setSignature && (
                <>
                    <li class="tsd-signature" id={props.setSignature.anchor}>
                        <span class="tsd-signature-symbol">set</span> {props.name}
                        {context.memberSignatureTitle(props.setSignature, {
                            hideName: true,
                        })}
                    </li>
                    <li class="tsd-description">{context.memberSignatureBody(props.setSignature)}</li>
                </>
            )}
        </ul>
    </>
);
